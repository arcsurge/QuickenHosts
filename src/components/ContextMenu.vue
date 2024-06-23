<template>
    <div class="menu">
        <a-space direction="vertical" :size="0" fill>
            <template v-for="(item, i) in props.composition" :key="i">
                <a-button :disabled="item.disabled" :class="transferCamel(item.icon.value.name)" type="text" long @click="item.action">
                    <template #icon>
                        <Component :is="item.icon.value" stroke-linecap="round" stroke-linejoin="round" size="20" />
                    </template>
                    {{ item.name }}
                </a-button>
            </template>
        </a-space>
    </div>
</template>

<script setup lang="ts">

import { CompositionMenus } from "@/assets/config/context-menu";
import { transferCamel } from "@/utils/globalUtil";

const props = defineProps<{
    composition: CompositionMenus[]
}>();

</script>

<style scoped>
.menu {
    display: flex;
    flex-direction: column;
    width: 8rem;
    padding: 0.5rem;
    background-color: #FFF;
    border-radius: var(--border-radius-small);
    box-shadow: 0 2px 8px #00000026;
}

.menu .arco-space-item .arco-btn {
    align-items: center;
}

.menu :deep(.arco-space-item .arco-btn .arco-btn-icon) {
    display: flex;
    align-items: center;
}

.arco-space-vertical .arco-space-item .arco-btn-text.arco-btn-disabled {
    cursor: pointer;
}

.arco-space-vertical .arco-space-item .arco-btn-text.icon-edit {
    color: rgb(var(--warning-6));
}

.arco-space-vertical .arco-space-item .arco-btn-text.icon-edit.arco-btn-disabled {
    color: var(--color-warning-light-3);
}

.arco-space-vertical .arco-space-item .arco-btn-text.icon-delete {
    color: rgb(var(--danger-6));
}

.arco-space-vertical .arco-space-item .arco-btn-text.icon-delete.arco-btn-disabled {
    color: var(--color-danger-light-3);
}

.arco-space-vertical .arco-space-item .arco-btn-text.icon-relation {
    color: rgb(var(--success-6));
}

.arco-space-vertical .arco-space-item .arco-btn-text.icon-loop {
    color: rgb(var(--primary-6));
}

.arco-space-vertical .arco-space-item .arco-btn-text {
    justify-content: left;
}

.arco-space-vertical .arco-space-item:first-child .arco-btn {
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;
}

.arco-space-vertical .arco-space-item:last-child .arco-btn {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
}

.arco-space-vertical .arco-space-item:not(:first-child, :last-child) .arco-btn {
    border-radius: 0;
}

.arco-space-vertical .arco-space-item:not(:last-child) .arco-btn-secondary {
    border-bottom: 1px solid var(--color-secondary-hover);
}
</style>
