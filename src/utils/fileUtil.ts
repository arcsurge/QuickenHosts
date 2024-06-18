import { copyShell } from "@/config/hosts.config";
import { AnyObject } from "@/types/global";
import { cmd } from "@/utils/ShellScript";
import { getModules } from "@/assets/script/module";

const { fs } = getModules();

export function read(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = '';
        fs.createReadStream(path, {
            encoding: 'utf8'
        }).on('data', (chunk: string) => {
            return data += chunk;
        }).on('error', (error: Error) => {
            return reject(error);
        }).on('end', () => {
            return resolve(data);
        });
    });
}

export function write(path: string, context: string, options: AnyObject = {}) {
    return new Promise((resolve, reject) => {
        const write = fs.createWriteStream(path, {
            flags: 'w',
            encoding: 'utf8',
            ...options
        }).on('error', (error: Error) => {
            return reject(error);
        }).on('finish', () => {
            return resolve(true);
        });
        write.write(context);
        write.end();
    });
}

export function copy(source: string, target: string, cover: boolean = false): Promise<boolean> {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(source)) {
            return reject(new Error(`source file: [${source}] no such file or directory`));
        }
        if (!cover && fs.existsSync(target)) {
            return resolve(true);
        }
        cmd(`${copyShell} ${source} ${target}`, { admin: true, name: 'copy' }).then(() => {
            return resolve(true);
        }).catch(reason => {
            return reject(reason.error);
        });
    });
}
