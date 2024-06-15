import { AnyObject } from "./types.mjs";

export const LOG_LEVEL: string = 'log';

/**
 * ContentType 映射表
 * @type {{text: string, download: string, form: string, json: string}}
 */
export const ContentType: AnyObject = {
    text: 'text/html; charset=UTF-8', // 文本数据
    json: 'application/json;charset=UTF-8', // json数据格式
    form: 'application/x-www-form-urlencoded; charset=UTF-8', // 表单数据格式
    download: 'application/octet-stream' // 二进制文件流格式，用于download
};

export const headers: AnyObject = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': ContentType.text,
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36'
};