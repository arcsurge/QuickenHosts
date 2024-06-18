import { LOG_LEVEL } from "@/config/constants";
import * as console from "node:console";

// 日志等级和对应的名称
// 0"debug" 1"log",2"info",3"warn",4"error"

export class JConsole implements Console {
    private originalConsole;
    logLevel = 0;

    constructor(originalConsole: any) {
        originalConsole.log("LOG_LEVEL", LOG_LEVEL);
        this.originalConsole = originalConsole;
        switch (LOG_LEVEL) {
            case "debug":
                this.logLevel = 0;
                break;
            case "log":
                this.logLevel = 1;
                break;
            case "info":
                this.logLevel = 2;
                break;
            case "warn":
                this.logLevel = 3;
                break;
            case "error":
                this.logLevel = 4;
                break;
        }
    }

    get debug() {
        if (this.logLevel < 1) {
            return this.originalConsole.debug;
        } else {
            return () => {
            };
        }
    }

    get log() {
        if (this.logLevel <= 1) {
            return this.originalConsole.log;
        } else {
            return () => {
            };
        }
    }

    get info() {
        if (this.logLevel <= 2) {
            return this.originalConsole.info;
        } else {
            return () => {
            };
        }
    }

    get warn() {
        if (this.logLevel <= 3) {
            return this.originalConsole.warn;
        } else {
            return () => {
            };
        }
    }

    get error() {
        if (this.logLevel <= 4) {
            // 出错了，上报一下服务器或者通知一下管理员
            return this.originalConsole.error;
        } else {
            return () => {
            };
        }
    }

    get memory() {
        return this.originalConsole.memory;
    }

    get assert() {
        return this.originalConsole.assert;
    }

    get clear() {
        return this.originalConsole.clear;
    }

    get count() {
        return this.originalConsole.count;
    }

    get dir() {
        return this.originalConsole.dir;
    }

    get dirxml() {
        return this.originalConsole.dirxml;
    }

    get exception() {
        return this.originalConsole.exception;
    }

    get group() {
        return this.originalConsole.group;
    }

    get groupCollapsed() {
        return this.originalConsole.groupCollapsed;
    }

    get groupEnd() {
        return this.originalConsole.groupEnd;
    }

    get markTimeline() {
        return this.originalConsole.markTimeline;
    }

    get msIsIndependentlyComposed() {
        return this.originalConsole.msIsIndependentlyComposed;
    }

    get profile() {
        return this.originalConsole.profile;
    }

    get profileEnd() {
        return this.originalConsole.profileEnd;
    }

    get select() {
        return this.originalConsole.select;
    }

    get table() {
        return this.originalConsole.table;
    }

    get time() {
        return this.originalConsole.time;
    }

    get timeEnd() {
        return this.originalConsole.timeEnd;
    }

    get timeStamp() {
        return this.originalConsole.timeStamp;
    }

    get timeline() {
        return this.originalConsole.timeline;
    }

    get timelineEnd() {
        return this.originalConsole.timelineEnd;
    }

    get trace() {
        return this.originalConsole.trace;
    }

    Console: console.ConsoleConstructor | any;

    countReset(label?: string): void {
    }

    timeLog(label?: string, ...data: any[]): void {
    }
}
