import { Component, ShallowRef } from 'vue';
import { IconDelete, IconEdit, IconRelation } from '@arco-design/web-vue/es/icon';
import { openMenu, setComponent } from "@/assets/script/context-menu";
import { logger } from "@/utils/JConsole";

export interface CompositionMenus {
    name: string;
    disabled: boolean;
    icon: ShallowRef;
    action: () => void;
}

export enum MENUS {
    RENAME = 'RENAME',
    INCREASE = 'INCREASE',
    DELETE = 'DELETE'
}

export type MenuHandler = {
    [K in keyof typeof MENUS]: () => void;
};

export function startContextMenu(component: Component, handle: MenuHandler) {
    setComponent(component);
    return (e: MouseEvent, current: string) => {
        const props = getProps(current, handle);
        logger.debug('current', current);
        openMenu(e, props);
    };
}

function getProps(current: string, handle: MenuHandler): { [key: string]: CompositionMenus[] } {
    return {
        composition: [{
            name: '重命名',
            disabled: ['MENU_VIEW_CONTENT', 'MENU_DEFAULT', 'EMPTY'].includes(current),
            icon: shallowRef(IconEdit),
            action: () => {
                handle[MENUS.RENAME]();
                logger.debug(`重命名`);
            }
        }, {
            name: '删除',
            disabled: ['MENU_VIEW_CONTENT', 'MENU_DEFAULT', 'EMPTY'].includes(current),
            icon: shallowRef(IconDelete),
            action: () => {
                handle[MENUS.DELETE]();
                logger.debug('删除');
            }
        }, {
            name: '新建',
            disabled: false,
            icon: shallowRef(IconRelation),
            action: () => {
                handle[MENUS.INCREASE]();
                logger.debug('新建');
            }
        }]
    };
}
