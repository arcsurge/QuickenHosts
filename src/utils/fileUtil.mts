import fs from "fs";
import { AnyObject } from "../config/types.mjs";
import { cmd } from "./ShellScript.mjs";
import { copyShell } from "../config/hosts.config.mjs";

export function read(path: string): Promise<{ data: string }> {
    return new Promise((resolve, reject) => {
        let data = ''
        fs.createReadStream(path, {
            encoding: 'utf8'
        }).on('data', chunk => {
            data += chunk
        }).on('error', error => {
            return reject({ error, data })
        }).on('end', () => {
            return resolve({ data })
        })
    })
}

export function write(path: string, context: string, options: AnyObject = {}) {
    return new Promise((resolve, reject) => {
        const write = fs.createWriteStream(path, {
            flags: 'w',
            encoding: 'utf8',
            ...options
        }).on('error', error => {
            return reject({ data: false, error })
        }).on('finish', () => {
            return resolve({ data: true })
        })
        write.write(context)
        write.end()
    })
}

export function copy(source: string, target: string, cover: boolean = false): Promise<{ data: boolean }> {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(source)) {
            return reject({ data: false, error: new Error('source file: no such file or directory') })
        }
        if (!cover && fs.existsSync(target)) {
            return resolve({ data: true })
        }
        cmd(`${copyShell} ${source} ${target}`, { admin: true, name: 'copy' }).then((_) => {
            return resolve({ data: true })
        }).catch(reason => {
            return reject({ data: false, error: reason })
        })
    })
}