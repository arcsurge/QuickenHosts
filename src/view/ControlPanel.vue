<template>
    <a-spin class="loading" :loading="loading" dot>
        <a-layout class="container">
            <a-resize-box :style="{ width: '200px', maxWidth: '500px' }" :directions="['right']">
                <a-layout-sider class="aside">
                    <a-menu :selected-keys="[selected.id]" @menu-item-click="onClickMenuItem">
                        <template v-for="(item, index) in content" :key="index">
                            <a-menu-item-group v-if="item.group" :title="item.group">
                                <template v-if="item.list && item.list.length">
                                    <a-menu-item v-for="li in item.list" :key="li.id"
                                                 @contextmenu="(e: MouseEvent) => openContextMenu(e, li.id)">
                                        <template #icon>
                                            <Component :is="li.icon" stroke-linecap="round" stroke-linejoin="round" size="20" />
                                        </template>
                                        <a-input v-if="renameItem.id === li.id" id="editInput" v-model="li.title"
                                                 class="menu-title" @keyup.enter="() => blurInput(toRaw(li))"
                                                 @blur="() => blurInput(toRaw(li))" />
                                        <span v-else class="menu-title" v-text="li.title" />
                                        <a-switch v-if="li.switch" v-model="li.status" type="round" size="small"
                                                  @change="() => switchChange(toRaw(li))" />
                                    </a-menu-item>
                                </template>
                                <a-empty v-else @contextmenu="(e) => openContextMenu(e, 'EMPTY')" />
                            </a-menu-item-group>
                            <template v-else>
                                <template v-if="item.list && item.list.length">
                                    <a-menu-item v-for="li in item.list" :key="li.id" @contextmenu="(e: MouseEvent) => openContextMenu(e, li.id)">
                                        <template #icon>
                                            <Component :is="li.icon" stroke-linecap="round" stroke-linejoin="round"
                                                       size="20" />
                                        </template>
                                        <span style="margin-right: 10px" v-text="li.title" />
                                    </a-menu-item>
                                </template>
                                <a-empty v-else @contextmenu="(e) => openContextMenu(e, 'EMPTY')" />
                            </template>
                        </template>
                    </a-menu>
                    <a-button @click="onClickStart" class="run-btn" shape="circle">
                        <icon-play-arrow />
                    </a-button>
                </a-layout-sider>
                <template #resize-trigger>
                    <div class="resize-box">
                        <div class="resize-box-line" />
                    </div>
                </template>
            </a-resize-box>

            <a-layout-content class="main">
                <div class="editor-container">
                    <div class="numbers" />
                    <!-- <textarea class="textarea" />-->
                    <a-textarea v-model="selected.content" :disabled="!selected.editing" class="textarea" />
                </div>
            </a-layout-content>
        </a-layout>
        <div class="setting-group">
            <a-button-group>
                <a-button :disabled="disabled.edit.value" size="small"
                          @click="() => selected.editing = !selected.editing">
                    编辑
                </a-button>
                <a-button size="small" :disabled="disabled.cancel.value" @click="editCancel">
                    取消
                </a-button>
                <a-button size="small" :disabled="disabled.save.value" @click="saveConfig">
                    保存
                </a-button>
            </a-button-group>
        </div>
        <a-modal v-model:visible="visible" :modal-style="{ width: '250px', padding: '15px 30px'}"
                 :cancel-button-props="{ size: 'mini'}" :ok-button-props="{ size: 'mini' }" :simple="true"
                 modal-class="delete-confirm-modal" @ok="handleOk" @cancel="handleCancel">
            <div>确定要删除该配置?</div>
        </a-modal>
    </a-spin>
</template>

<script setup lang="ts">
import ContextMenu from "@/components/ContextMenu.vue";
import { App } from "vue";
import { Menu, MenuItem, UtoolsData } from "@/types/global";
import { MenuHandler, startContextMenu } from "@/assets/config/context-menu";
import { initEditor } from "@/assets/script/textarea-editor";
import { deleteMenuItem, getMenuItem, getMenuList, getQuickenContent, setQuickenContent, updateMenuItem, upsertCustomMenuItem } from "@/assets/data/data";
import { mixedString } from "@/utils/globalUtil";
import { getHosts, main, setHosts } from "@/assets/script/hosts";
import { logger } from "@/utils/JConsole";

let textarea: HTMLInputElement;
let numbers: HTMLElement;
const loading = ref<boolean>(false);

let loadedLineNumber: () => void;
onMounted(() => {
    logger.debug("mount");
    textarea = document.querySelector('.textarea .arco-textarea') as HTMLInputElement;
    numbers = document.querySelector('.numbers') as HTMLElement;
    const res = initEditor(textarea, numbers);
    loadedLineNumber = res.loadedLineNumbers;
    textarea.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault(); // 阻止默认的保存行为
            // 在这里执行你的代码
            saveConfig();
            logger.log('Ctrl + S 被按下');
        }
    });
});

ContextMenu.install = (app: App): void => {
    app.component(ContextMenu.name as string, ContextMenu);
};

const visible = shallowRef<boolean>(false);
const current = ref<string>();
const disabled = {
    edit: computed<boolean>(() => {
        return selected.editing;
    }),
    cancel: computed<boolean>(() => {
        return !selected.editing;
    }),
    save: computed<boolean>(() => {
        return !selected.editing || selected.original === selected.content;
    })
};

const isViewContent = computed<boolean>(() => {
    return selected.id === 'MENU_VIEW_CONTENT';
});

function toggleViewContent() {
    if (!isViewContent.value) {
        onClickMenuItem('MENU_VIEW_CONTENT');
    }
}

const selected = reactive({
    editing: false,
    id: 'MENU_VIEW_CONTENT',
    original: '',
    content: getQuickenContent('MENU_VIEW_CONTENT').content
});

const renameItem = reactive({
    id: ''
});

const content = reactive<Menu[]>(getMenuList());

const handle: MenuHandler = {
    RENAME: () => {
        renameItem.id = current.value as string;
        nextTick(() => {
            const editInput = document.querySelector("#editInput input") as HTMLInputElement;
            editInput.focus();
        });
    },
    INCREASE: () => {
        const newId = new Date().getTime() + mixedString(5);
        renameItem.id = newId;
        nextTick(() => {
            const editInput = document.querySelector("#editInput input") as HTMLInputElement;
            editInput.focus();
        });
        content[2].list.push({
            id: newId,
            title: '配置1',
            switch: true,
            status: false,
            icon: 'icon-relation'
        });
    },
    DELETE: () => {
        handleClick();
    }
};
const contextMenu = startContextMenu(ContextMenu, handle);

function openContextMenu(e: MouseEvent, id: string) {
    current.value = id;
    contextMenu(e, id);
}

function blurInput(item: MenuItem) {
    renameItem.id = '';
    logger.debug("blur input");
    upsertCustomMenuItem(item);
}

const handleClick = () => {
    visible.value = true;
};

const handleOk = () => {
    visible.value = false;
    deleteMenuItem(current.value as string);
    content.splice(0, content.length);
    content.length = 0;
    content.push(...getMenuList());
    selected.id === current.value && toggleViewContent();
};

const handleCancel = () => {
    visible.value = false;
};

const switchChange = (item: MenuItem) => {
    logger.debug(item);
    logger.debug(selected);
    const origin = getMenuItem(item.id);
    if (!origin) return;
    origin.status = item.status;
    updateMenuItem(origin);
};

function saveHosts() {
    setHosts(selected.content ?? '').then((data) => {
        logger.debug(data);
        if (data) {
            AMessage.success('Update success.');
        } else {
            AMessage.error('Update failed.');
        }
    }).catch((e) => {
        AMessage.error(`Update failed, message: ${e.message}.`);
    });
}

function saveConfig(): void {
    logger.debug(selected);
    selected.editing = false;
    selected.original = selected.content;
    setQuickenContent({ id: selected.id, content: selected.content });
    if (isViewContent.value) {
        saveHosts();
    }
}

function editCancel() {
    selected.editing = false;
    selected.content = selected.original;
}

function onClickMenuItem(key: string): void {
    // 当前选择的就是此项 | 避免重命名时的切换
    if (selected.id === key || key === renameItem.id) {
        return;
    }
    logger.debug(key, renameItem.id);
    editCancel();
    selected.id = key;
    selected.content = getQuickenContent(key).content;
}

watch(() => selected.content, async () => {
    await nextTick();
    loadedLineNumber();
}, {
    flush: 'post'
});

watch(() => selected.id, async (newValue) => {
    try {
        logger.debug(newValue, selected.id, isViewContent.value);
        if (isViewContent.value) {
            logger.debug("view content");
            selected.content = await getHosts();
            selected.original = selected.content;
        }
    } catch (error) {
        const e = error as Error;
        logger.error(e);
        AMessage.error(e.message);
    }
}, {
    immediate: true
});

const enterAction = inject<UtoolsData>("enterAction");

watch(() => enterAction, () => {
    const code = enterAction?.action?.code
    if (code === 'quicken') {
        console.log(enterAction)
        window.utools.hideMainWindow();
        window.utools.showNotification("正在开始加速，请稍后...");
        startQuicken(code);
    }
}, {
    deep: true
});

function onClickStart() {
    startQuicken('');
}

function reload() {
    if (!isViewContent.value) {
        return toggleViewContent();
    }
    getHosts().then(data => {
        selected.content = data;
        selected.original = selected.content;
    }).catch(e => {
        logger.error(e);
        AMessage.error(`Reload failed, message: ${e.message}.`);
    });
}

function startQuicken(startCode: string) {
    logger.debug("run shell");
    loading.value = true;
    main().then(data => {
        logger.debug(data);
        if (data) {
            reload();
            if (startCode === 'quicken') {
                window.utools.showNotification("加速完成");
                window.utools.outPlugin();
            } else {
                AMessage.success('Quicken success.');
            }
        } else {
            if (startCode === 'quicken') {
                window.utools.showNotification("加速失败");
            } else {
                AMessage.error('Quicken failed.');
            }
        }
    }).catch(e => {
        logger.error(e);
        if (startCode === 'quicken') {
            window.utools.showNotification(`Quicken failed, message: ${e.message}.`);
        } else {
            AMessage.error(`Quicken failed, message: ${e.message}.`);
        }
    }).finally(() => {
        loading.value = false;
    });
}
</script>

<style scoped>
.loading {
    width: 100%;
    height: 100%;
}

.resize-box {
    position: relative;
    display: flex;

    /* background-color: var(--color-bg-2); */
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

.resize-box-line {
    /* background-color: rgb(var(--arcoblue-6)); */
    width: 5px;
    height: 100%;
}

.setting-group {
    text-align: right;
}

.setting-group .arco-btn-group {
    height: 28px;
}

.setting {
    position: absolute;
    top: 13px;
    right: 13px;
    display: inline-block;
}

.setting .setting-icon {
    color: var(--color-text-2);
    cursor: pointer;
    transition: color .3s;
}

.setting .setting-icon:hover {
    animation: arco-loading-circle 2s infinite cubic-bezier(0, 0, 1, 1);
}

.setting .setting-icon:active {
    color: rgb(var(--primary-6));
}

.arco-modal-container .arco-modal-wrapper .arco-modal.setting-modal {
    border-radius: 0 !important;
}

.setting .arco-btn:hover .arco-icon-settings {
    animation: arco-loading-circle 1s infinite cubic-bezier(0, 0, 1, 1)
}

:deep(.arco-menu-item), :deep(.arco-menu-item-inner) {
    display: flex !important;
    align-items: center;
    justify-content: space-between;
}

.container {
    height: calc(100% - 30px);
    font-weight: 500;
    border-top: 1px solid var(--color-border-3);
    border-bottom: 1px solid var(--color-border-3);
}

.container .run-btn {
    position: fixed;
    bottom: 45px;
    left: 20px;

    --color-secondary: var(--color-bg-5);

    box-shadow: 0 2px 12px #0000001a;
}

.container .aside {
    width: auto !important;
    height: 100%;

    /* max-width: 200px; */
    border-right: 1px solid var(--color-border-3);
    box-shadow: none;
}

.container .aside :deep(.arco-layout-sider-children) {
    padding-left: 12px;
    overflow-y: scroll;
    color: transparent;
    transition: color .3s;
}

.container .aside :deep(.arco-layout-sider-children):hover {
    color: var(--color-fill-3);
}

/* ----- 滚动条 ----- */
:deep(.arco-layout-sider-children)::-webkit-scrollbar {
    width: 12px;
    background: transparent;
}

:deep(.arco-layout-sider-children)::-webkit-scrollbar-thumb {
    background: transparent content-box;
    border: 3px solid transparent;
    border-radius: 5px;
    box-shadow: inset 0 0 0 6px;
}

:deep(.arco-layout-sider-children)::-webkit-scrollbar-track-piece {
    background: transparent;
}

:deep(.arco-layout-sider-children)::-webkit-scrollbar-thumb:hover {
    color: var(--color-fill-4);
}

/* ----- 滚动条 ----- */
.container :deep(.arco-menu-icon) {
    margin-right: 10px !important;
}

.arco-menu-item > .arco-menu-item-inner.arco-menu-title > .menu-title {
    width: 100px;
    margin-right: 10px;
    line-height: 20px;
    word-wrap: break-word;
    white-space: pre-wrap;
}

.container :deep(.arco-menu-vertical .arco-menu-inner) {
    padding: 12px 0 !important;
}
</style>
