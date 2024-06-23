export interface AnyObject {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export interface UtoolsAction {
    code: string;
    type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    option: any
}

export interface QuickenContent {
    id: string;
    content: string;
}

export interface QuickenGroup {
    name: string;
    list: string[];
}

export interface HostsGroup {
    name: string;
    hosts: HostsData[];
}

export interface UtoolsData {
    action?: UtoolsAction;
}

export interface HostsData {
    name: string,
    ip: string
}

export interface MenuItem {
    id: string;
    icon?: string;
    title?: string;
    fixed?: boolean;
    switch?: boolean; // 是否可启用/禁用
    status?: boolean; // 是否启用
}

export interface Menu {
    group?: string;
    list: MenuItem[];
}

export interface ContextMenus {
    show: boolean;
    scope?: HTMLElement;
    container?: HTMLDivElement;
}
