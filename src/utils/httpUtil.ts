import { AnyObject } from "@/types/global";
import { ContentType } from "@/config/constants";
import { mergeDeep } from "@/utils/globalUtil";

/**
 * 请求
 * @param { string } path
 * @param { {} } data
 * @param config
 * @returns { Promise<any> }
 */
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
