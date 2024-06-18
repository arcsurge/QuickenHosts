import { AnyObject } from "@/types/global";
import { logger } from "@/assets/script/module";

function mergeDeep(target: AnyObject, source: AnyObject): AnyObject {
    // 遍历源对象中的所有属性
    for (let key in source) {
        key = key.toLocaleLowerCase();
        if (Object.hasOwnProperty.call(source, key)) {
            const value = source[key];
            // 检查值是否为对象，如果是，则递归合并
            if (typeof value === 'object' && value !== null) {
                // 确保目标对象有相同的键
                if (!target[key]) {
                    target[key] = Array.isArray(value) ? [] : {};
                }
                // 递归合并
                mergeDeep(target[key], value);
            } else {
                // 如果值不是对象，直接赋值
                target[key] = value;
            }
        }
    }
    return target;
}

function retrySync(fn: (...args: any[]) => any, retries: number, delay: number, ...args: any[]) {
    let attempts = retries;
    logger.debug(`Starting execution, you have a total of ${retries} retry attempts.`);

    async function execute() {
        try {
            // 尝试执行函数
            return await fn(...args);
        } catch (error) {
            const e = error as Error;
            if (attempts-- <= 0) {
                // 超过最大重试次数，抛出异常
                throw e;
            }
            logger.debug(`Attempt ${retries - attempts} failed: ${e.message}. Retrying in ${delay}ms...`);
            // 延迟
            await new Promise(resolve => setTimeout(resolve, delay));
            return execute();
        }
    }

    return execute();
}

function lJust(str: string, total: number, fillChar = ' ') {
    const padding = Math.max(0, total - str.length);
    return str + fillChar.repeat(padding);
}

// 生成n位数字字母混合字符串
function mixedString(n: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return <string>Array.from({ length: n }).reduce(res => {
        const id = Math.floor(Math.random() * chars.length);
        return res + chars.charAt(id);
    }, '');
}

function transferCamel(camel: string) {
    return camel
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .slice(1);
}

function splitLines(str: string) {
    return str.split(/\r\n|\r|\n/);
}

export { mergeDeep, retrySync, lJust, transferCamel, splitLines, mixedString };
