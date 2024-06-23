import { Menu, MenuItem, QuickenContent, QuickenGroup } from '@/types/global'
import { splitLines } from "@/utils/globalUtil";
import { isWebsite } from "@/utils/httpUtil";
import { logger } from "@/utils/JConsole";

type group = 'content' | 'default' | 'custom';
const defaultConfig: Record<group, Menu> = {
    content: {
        list: [
            {
                id: 'MENU_VIEW_CONTENT',
                title: '查看文件内容',
                switch: false,
                fixed: true,
                status: false,
                icon: 'icon-desktop'
            }
        ]
    },
    default: {
        group: '默认',
        list: [
            {
                id: 'MENU_DEFAULT',
                title: '默认配置',
                switch: false,
                status: true,
                fixed: true,
                icon: 'icon-pushpin'
            }
        ]
    },
    custom: {
        group: '自定义',
        list: []
    }
}
const separator = '#'

function getDbKey(key: string, field: string = ''): string {
    return `${key}${separator}${field}`;
}

function hSet<T>(key: string, field: string, value: T): boolean {
    const dbKey = getDbKey(key, field);
    const dbValue: DbDoc = utools.db.get(dbKey) as DbDoc;
    const data: DbDoc = {
        _id: dbKey,
        data: value
    }
    if (dbValue) {
        data._rev = dbValue._rev;
    }
    logger.debug('data', data);
    const dbReturn = utools.db.put(data);
    logger.debug('dbReturn', dbReturn);
    return dbReturn.ok ?? false;
}

function hMSet<T>(key: string, ...fieldValuePairs: [string, T][]): boolean {
    const dbDocs = fieldValuePairs.map(([field, value]): DbDoc => {
        return {
            _id: getDbKey(key, field),
            data: value
        }
    });
    logger.debug('hMSet', dbDocs);
    if (dbDocs.length > 0) {
        return utools.db.bulkDocs(dbDocs).every(result => result.ok) ?? false;
    }
    return false;
}

function hMGet<T>(key: string, ...fields: string[]): T[] {
    const dbKeys: string[] = fields.map(field => getDbKey(key, field));
    logger.debug('hMGet', dbKeys);
    if (dbKeys.length > 0) {
        return utools.db.allDocs(dbKeys).map(doc => doc.data) ?? [];
    }
    return [];
}

function hSetnx<T>(key: string, field: string, value: T): boolean {
    return utools.db.put({
        _id: getDbKey(key, field),
        data: value
    }).ok ?? false;
}

function hDel(key: string, field: string): boolean {
    return utools.db.remove(getDbKey(key, field)).ok ?? false;
}

function hGetAll<T>(key: string) {
    const dbDocs = utools.db.allDocs(getDbKey(key));
    logger.debug(getDbKey(key), 'dbDocs', dbDocs);
    return dbDocs ?? [];
}

function hKeys(key: string): string[] {
    return hGetAll(key).map((doc: DbDoc) => doc._id.replace(new RegExp(`^${getDbKey(key)}`), '')) ?? [];
}

function hVals<T>(key: string): T[] {
    return hGetAll<T>(key).map((doc: DbDoc) => doc.data as T) ?? [];
}

function hGet<T>(key: string, field: string): T {
    return utools.db.get(getDbKey(key, field))?.data as T;
}

const dbStorageQuickenContentPrefix = 'QUICKEN_CONTENT'
const dbStorageMenuItemPrefix = 'MENU_ITEM'

function getCustomMenuItemList() {
    const list = hVals<MenuItem>(dbStorageMenuItemPrefix) ?? [];
    logger.debug('CustomMenuItemList', list);
    return list;
}

export function upsertCustomMenuItem(item: MenuItem): boolean {
    return hSet<MenuItem>(dbStorageMenuItemPrefix, item.id, item);
}

function getMenuItemList(): MenuItem[] {
    const list: MenuItem[] = [...defaultConfig.content.list, ...defaultConfig.default.list, ...getCustomMenuItemList()];
    logger.debug('MenuItemList', list);
    return list;
}

export function getQuickenContent(id: string): QuickenContent {
    const content = hGet<QuickenContent>(dbStorageQuickenContentPrefix, id);
    logger.debug('QuickenContent', content);
    if (content) return content;
    return {
        id,
        content: ''
    }
}

export function setQuickenContent(content: QuickenContent): boolean {
    logger.debug('setQuickenContent', content);
    return hSet<QuickenContent>(dbStorageQuickenContentPrefix, content.id, content);
}

export function getMenuItem(id: string): MenuItem {
    return hGet<MenuItem>(dbStorageMenuItemPrefix, id);
}

export function getMenuList(): Menu[] {
    const list = [
        defaultConfig.content,
        defaultConfig.default, {
            group: defaultConfig.custom.group,
            list: getCustomMenuItemList()
        }
    ];
    logger.debug('MenuList', list);
    return list;
}

export function updateMenuItem(item: MenuItem): boolean {
    logger.debug('updateMenuItem', item);
    return hSet<MenuItem>(dbStorageMenuItemPrefix, item.id, item);
}

export function deleteMenuItem(id: string): boolean {
    return hDel(dbStorageMenuItemPrefix, id);
}

export function getIpAddress(): QuickenGroup[] {
    const items: MenuItem[] = getMenuItemList()
        .filter(item => item.status);
    logger.debug('getIpAddress ids', items);
    const ids: string[] = items.map(item => item.id);
    return hMGet<QuickenContent>(dbStorageQuickenContentPrefix, ...ids)
        .map((content: QuickenContent, index: number) => {
            const websites = splitLines(content.content).filter(isWebsite);
            logger.debug('getIpAddress websites', websites);
            return {
                name: items[index].title,
                list: websites
            } as QuickenGroup;
        });
}
