import { AnyObject } from "@/types/global";
import { ContentType } from "@/config/constants";
import { mergeDeep } from "@/utils/globalUtil";
import { getModules } from "@/assets/script/module";

const { pingAsync } = getModules();

/**
 * 请求
 * @param { string } path
 * @param { {} } data
 * @param config
 * @returns { Promise<any> }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function request(path: string | URL | Request, data: AnyObject, config = {}): Promise<any> {
    /**
     * 转化请求参数
     * @param data
     * @returns { string }
     */
    function transform(data: { [x: string]: string | number | boolean; }): string {
        const esc = encodeURIComponent;
        // 转换参数
        return Object.keys(data)
            .map(k => `${esc(k)}=${esc(data[k])}`)
            .join('&');
    }

    let cfg: AnyObject = {
        method: 'GET',
        headers: {
            'Content-Type': ContentType.form
        }
    };
    cfg = mergeDeep(cfg, config);
    cfg.method = cfg.method.toLocaleUpperCase();
    // 如果是get请求
    if (cfg.method === 'GET') {
        // 转换拼接get参数
        const param = transform(data);
        if (param) path += `?${param}`;
    } else if (cfg.headers["Content-type"] === ContentType.form) {
        cfg.body = transform(data);
    } else {
        // 其他请求 放入body里面
        cfg.body = JSON.stringify(data);
    }
    return fetch(path, config).then(response => {
        if (response.ok) {
            const type = response.headers.get("Content-Type");
            if (type && type.includes(ContentType.json)) {
                return response.json();
            } else if (type && type.includes(ContentType.text)) {
                return response.text();
            }
        }
        return response.text();
    });
}

type PingResult = {
    address: string,
    avg: number;
};

export async function getOptimalIp(ips: string[]): Promise<string> {
    if (ips.length === 1) {
        return ips[0];
    }
    const results: PromiseSettledResult<PingResult>[] = await Promise.allSettled(ips.map(ip => pingAsync(ip).then((r: PingResult): PingResult => ({
        address: ip,
        avg: Number.isNaN(r.avg) ? Infinity : r.avg
    }))));

    // 过滤掉失败的ping请求
    return results.filter((r: PromiseSettledResult<PingResult>) => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<PingResult>).value)
        .reduce((prev: PingResult, current: PingResult) => (prev.avg < current.avg) ? prev : current).address;
}

export function getIpType(ip: string): "IPv4" | "IPv6" | "Neither" {
    // IPv4地址的正则表达式
    const ipv4Regex = /^((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}$/;
    // IPv6地址的正则表达式
    const ipv6Regex = /^([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}$/;

    if (ipv4Regex.test(ip)) {
        return "IPv4";
    } else if (ipv6Regex.test(ip)) {
        return "IPv6";
    } else {
        return "Neither";
    }
}

export function isIPv4(ip: string): boolean {
    return getIpType(ip) === "IPv4";
}

export function isIPv6(ip: string): boolean {
    return getIpType(ip) === "IPv6";
}

export function isIP(ip: string): boolean {
    return getIpType(ip) !== "Neither";
}

export function isWebsite(url: string): boolean {
    const urlRegex = /^(?:http:\/\/|https:\/\/)?[a-z0-9]+(?:[.-][a-z0-9]+)*\.[a-z]{2,}(?::\d{1,5})?(?:\/.*)?$/i;
    return urlRegex.test(url);
}
