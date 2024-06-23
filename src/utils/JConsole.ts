import { LOG_LEVEL } from "@/config/constants";

type LogLevel = 'debug' | 'log' | 'info' | 'warn' | 'error';

const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
    debug: 0,
    log: 1,
    info: 2,
    warn: 3,
    error: 4
};

const COLOR_MAP: Record<LogLevel, string> = {
    debug: '#2d8cf0',
    log: '#19be6b',
    info: '#909399',
    warn: '#ff9900',
    error: "#FF0000"
};

const getColor = (type: LogLevel) => COLOR_MAP[type];

export class JConsole implements Console {

    Console: Console | any;
    logLevel = 0;

    constructor(Console: Console) {
        this.Console = Console;
        this.Console.log("LOG_LEVEL", LOG_LEVEL);
        this.logLevel = LOG_LEVEL_VALUES[LOG_LEVEL as LogLevel] ?? 0;
    }

    private shouldLog(methodLogLevel: number): boolean {
        return this.logLevel <= methodLogLevel;
    }

    private print(logLevel: LogLevel) {
        if (this.shouldLog(LOG_LEVEL_VALUES[logLevel])) {
            const color = getColor(logLevel);
            return this.Console[logLevel].bind(this.Console, "%c[Tools]:", `font-weight:bold;background-color:${color}; padding: 2px; margin: 5px 0px; border-radius:2px; color: #fff;`);
        }
        return () => {};
    }

    get debug() {
        return this.print("debug");
    }

    get log() {
        return this.print("log");
    }

    get info() {
        return this.print("info");
    }

    get warn() {
        return this.print("warn");
    }

    get error() {
        return this.print("error");
    }

    get assert() {
        return this.Console.assert;
    }

    get clear() {
        return this.Console.clear;
    }

    get count() {
        return this.Console.count;
    }

    get dir() {
        return this.Console.dir;
    }

    get dirxml() {
        return this.Console.dirxml;
    }

    get group() {
        return this.Console.group;
    }

    get groupCollapsed() {
        return this.Console.groupCollapsed;
    }

    get groupEnd() {
        return this.Console.groupEnd;
    }

    get profile() {
        return this.Console.profile;
    }

    get profileEnd() {
        return this.Console.profileEnd;
    }

    get table() {
        return this.Console.table;
    }

    get time() {
        return this.Console.time;
    }

    get timeEnd() {
        return this.Console.timeEnd;
    }

    get timeStamp() {
        return this.Console.timeStamp;
    }

    get trace() {
        return this.Console.trace;
    }

    countReset(label?: string): void {
        this.Console.countReset(label);
    }

    timeLog(label?: string, ...data: any[]): void {
        this.Console.timeLog(label, ...data);
    }
}

export const logger = new JConsole(console);
