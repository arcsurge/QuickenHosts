import { quickenConfigs } from "@/config/hosts.config";
import { getIpAddress } from "@/assets/data/data";

export interface Modules {
    path: typeof import('node:path'),
    fs: typeof import('fs'),
    process: typeof import('node:process'),
    exec: typeof import('public/sudo-prompt').exec,
    pingAsync: typeof import('public/ping').pingAsync
}

export function getModules(): Modules {
    if (typeof window !== 'undefined' && window.tools) {
        return window.tools;
    } else {
        return {
            process: require("node:process"),
            exec: require("public/sudo-prompt").exec,
            path: require("node:path"),
            pingAsync: require("public/ping").pingAsync,
            fs: require("fs")
        }
    }
}

export function getQuickenConfigs() {
    if (typeof window !== 'undefined' && window.tools) {
        return getIpAddress();
    } else {
        return quickenConfigs;
    }
}
