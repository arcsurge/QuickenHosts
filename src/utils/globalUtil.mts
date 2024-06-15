import { AnyObject } from "../config/types.mjs";

export function mergeDeep(target: AnyObject, source: AnyObject): AnyObject {
    // 遍历源对象中的所有属性
    for (let key in source) {
        key = key.toLocaleLowerCase();
        if (source.hasOwnProperty(key)) {
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

export function retrySync(fn: (...args: any[]) => any, retries: number, delay: number, ...args: any[]) {
    let attempts = retries;
    console.debug(`Starting execution, you have a total of ${retries} retry attempts.`);

    async function execute() {
        try {
            // 尝试执行函数
            return await fn(...args);
        } catch (e: Error | any) {
            if (attempts-- <= 0) {
                // 超过最大重试次数，抛出异常
                throw e;
            }
            console.debug(`Attempt ${retries - attempts} failed: ${e.message}. Retrying in ${delay}ms...`);
            // 延迟
            await new Promise(resolve => setTimeout(resolve, delay));
            return execute();
        }
    }
    return execute();
}

export function lJust(str: string, total: number, fillChar = ' ') {
    const padding = Math.max(0, total - str.length)
    return str + fillChar.repeat(padding)
}