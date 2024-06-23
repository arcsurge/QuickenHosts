import { AnyObject } from "@/types/global";
import { getModules } from "@/assets/script/module";
import { cmd } from "@/utils/ShellScript";
import { copyDir, copyFile } from "@/config/hosts.config";
import { logger } from "@/utils/JConsole";
const { fs } = getModules()
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

export function write(path: string, context: string, options: AnyObject = {}): Promise<boolean> {
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

export function copy(source: string, target: string, ops?: { cover?: boolean, admin?: boolean }): Promise<boolean> {
    const defaults = { cover: false, admin: false };
    const options = {...defaults, ...ops};
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(source)) {
            return reject(new Error(`source file: [${source}] no such file or directory`));
        }
        if (!options?.cover && fs.existsSync(target)) {
            return resolve(true);
        }
        const stats = fs.statSync(source);
        let copyShell = `${copyFile} ${source} ${target}`;
        if (stats.isDirectory()) {
            copyShell = `${copyDir} ${source} ${target}`;
        }
        logger.log("run copy: ", copyShell);
        cmd(`${copyShell}`, { admin: options?.admin, name: 'copy' }).then(() => {
            return resolve(true);
        }).catch(reason => {
            return reject(reason.error);
        });
    });
}

export function remove(source: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(source)) {
            return resolve(true);
        }
        const stats = fs.statSync(source);
        fs.rm(source, { recursive: stats.isDirectory() }, (error) => {
            if (error) {
                return reject(error);
            }
            return resolve(true);
        });
    });
}

export function rename(source: string, target: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        fs.rename(source, target, (error) => {
            if (error) {
                return reject(error);
            }
            return resolve(true);
        });
    });
}
