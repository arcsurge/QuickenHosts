import { AnyObject } from "@/types/global";
import { JConsole } from "@/utils/JConsole";

export function getModules(): AnyObject {
    if (typeof window !== 'undefined' && window.tools) {
        return window.tools;
    } else {
        return {
            process,
            exec: require("/public/sudo-prompt").exec,
            path: require("node:path"),
            pingAsync: require("/public/ping").pingAsync,
            fs: require("fs")
        }
    }
}

export const logger = new JConsole(console);