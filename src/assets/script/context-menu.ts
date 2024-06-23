import { AnyObject, ContextMenus } from '@/types/global';
import { Component, render } from 'vue';

const menu = reactive<ContextMenus>({
    show: false
});

let ContextMenu: Component;

watch(() => menu.show, val => {
    if (val) {
        menu.scope?.addEventListener('click', closeMenu);
    } else {
        menu.scope?.removeEventListener('click', closeMenu);
    }
});

function closeMenu() {
    if (menu.show) {
        menu.scope?.removeChild(menu.container as HTMLDivElement);
        render(null, menu.container as HTMLDivElement);
        // logger.log("清除")
        menu.show = false;
    }
}

export function openMenu(e: MouseEvent, props: AnyObject) {
    e.preventDefault();
    closeMenu();
    menu.container = document.createElement('div');
    // 创建自定义菜单
    render(h(ContextMenu, props), menu.container);
    menu.container.style.position = 'absolute';
    menu.scope?.appendChild(menu.container);
    const { clientX, clientY } = e;
    const { clientWidth, clientHeight } = menu.scope as HTMLElement;
    const { offsetWidth, offsetHeight } = menu.container;
    const offset_top = clientY - (menu.scope?.getBoundingClientRect().top as number);
    menu.container.style.top =
        clientHeight - clientY > offsetHeight ? `${offset_top}px` : `${offset_top - offsetHeight}px`;
    menu.container.style.left =
        clientWidth - clientX > offsetWidth ? `${clientX}px` : `${clientX - offsetWidth}px`;
    menu.show = true;
}

export function setComponent(component: Component, scope = document.body) {
    ContextMenu = component;
    menu.scope = scope;
}
