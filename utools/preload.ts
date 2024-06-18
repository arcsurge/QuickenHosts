import fs from "fs";
import path from "node:path";
import { logger } from "@/assets/script/module";
import { exec } from "../public/sudo-prompt";
import { pingAsync } from "../public/ping";

window.tools = {
    process, exec, path, pingAsync, fs
};

interface UtoolsAction {
    code: string,
    type: string,
    payload: any,
    option: any
}

window.exports = {
    "quicken": {
        mode: "none",  // 用于无需 UI 显示，执行一些简单的代码
        args: {
            // 进入插件应用时调用
            enter: (action: UtoolsAction) => {
                utools.hideMainWindow();
                utools.showNotification("正在开始加速...");
                const { main } = require("@/assets/script/hosts")
                main().then((data: boolean) => {
                    logger.log('Update hosts', data);
                    utools.showNotification(`更新${data ? '成功' : '失败'}.`);
                }).catch((e: Error) => {
                    logger.error(e);
                    utools.showNotification(`更新失败, 详情: ${e.message}.`);
                }).finally(() => {
                    utools.outPlugin();
                })
            }
        }
    }
};
