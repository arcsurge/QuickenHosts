import moment from 'moment';
import { headers } from "@/config/constants";
import {
    endStr,
    flushDns,
    githubUrls,
    hostsConfig,
    ipAddressBaseUrl,
    path as hostsPath,
    startStr
} from '@/config/hosts.config';
import { cmd } from "@/utils/ShellScript";
import { request } from "@/utils/httpUtil";
import { lJust, retrySync } from "@/utils/globalUtil";
import { copy, read, write } from "@/utils/fileUtil";
import { HostsData } from "@/types/global";
import { getModules, logger } from "@/assets/script/module";

const { path, pingAsync } = getModules();

async function getOptimalIp(ips: string[]) {
    type PingResult = {
        address: string,
        avg: number;
    };
    if (ips.length === 1) {
        return ips[0];
    }
    const results = await Promise.allSettled(ips.map(ip => pingAsync(ip).then((r: PingResult) => ({
        address: ip,
        avg: Number.isNaN(r.avg) ? Infinity : r.avg
    }))));

    // 过滤掉失败的ping请求
    return results.filter((r: PromiseSettledResult<PingResult>) => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<PingResult>).value)
        .reduce((prev: PingResult, current: PingResult) => (prev.avg < current.avg) ? prev : current).address;
}

function extractIPAddresses(inputString: string) {
    const combinedRegex = /<div[^>]*id="tabpanel-dns-a"[^>]*>([\s\S]*?)<\/div>/;
    const divMatch = inputString.match(combinedRegex);
    if (!divMatch) {
        return []; // 如果没有匹配到指定的div id，则返回空数组
    }

    const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
    const ipMatches = divMatch[1].match(ipRegex) || [];
    return [...new Set(ipMatches)];
    // return ipMatches || [];
}

function validateIP(ip: string): "IPv4" | "IPv6" | "Neither" {
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

function resolveUrl(host: string): string {
    return ipAddressBaseUrl + host;
}

async function getIPAddresses(host: string): Promise<string> {
    return await retrySync(async (h) => {
        const htmlContent = await request(resolveUrl(h), {}, { headers });
        const ipAddresses = extractIPAddresses(htmlContent);
        const ips = Array.from(new Set(ipAddresses));
        if (!ips || ips.length === 0) {
            throw new Error(h + 'ip not found!');
        }
        return getOptimalIp(ips);
    }, 3, 1000, host);
}

async function getHostsData() {
    const promises = githubUrls.map(url => getIPAddresses(url));
    const results = await Promise.allSettled(promises);
    const hosts: HostsData[] = [];
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            const r = validateIP(result.value);
            if (['IPv4', 'IPv6'].includes(r)) {
                hosts.push({
                    name: githubUrls[index],
                    ip: result.value
                });
            } else {
                logger.error(`URL ${githubUrls[index]} rejected with reason: than IP`);
            }
        } else {
            logger.error(`URL ${githubUrls[index]} rejected with reason: ${result.reason}`);
        }
    });
    logger.debug(hosts);
    return hosts;
}

function hostsBackup() {
    return new Promise((resolve, reject) => {
        const { filename, backup } = hostsConfig;
        copy(path.resolve(hostsPath, filename), path.resolve(hostsPath, backup)).then((data: boolean) => {
            logger.log(data ? 'Local hosts backup successfully!' : 'Local hosts backup failed!');
            resolve(data);
        }).catch(e => {
            // logger.error(e);
            reject(e as Error);
        });
    });
}

async function hostsRestore() {
    const { filename, backup } = hostsConfig;
    try {
        return await copy(path.resolve(hostsPath, backup), path.resolve(hostsPath, filename));
    } catch (e) {
        logger.error(e as Error);
        return false;
    }
}

async function getHosts(): Promise<string> {
    const hostsFile = path.resolve(hostsPath, hostsConfig.filename);
    try {
        return await read(hostsFile);
    } catch (error) {
        // logger.error(e);
        throw error as Error;
    }
}

async function setHosts(context: string) {
    const hostsFile = path.resolve(hostsPath, hostsConfig.filename);
    await write(hostsFile, context);
}

function buildHosts(hosts: HostsData[], joinStr = '\n'): string {
    return hosts.map((host: HostsData) => lJust(host.ip, 20) + host.name).join(joinStr);
}

async function hostsUpdate(): Promise<boolean> {
    try {
        logger.log('Updating hosts...');
        if (!await hostsBackup()) {
            logger.error('Backup hosts failed!');
            return false;
        }
        const hostsContent = await getHosts();
        const lineEndMatch = /(\r\n|\n|\r)/.exec(hostsContent);
        const lineEndStr = lineEndMatch ? lineEndMatch[0] : '\n';
        const utime = moment().format('YYYY-MM-DD HH:mm:ss');
        const hostsData = await getHostsData();
        const newHostsData: string = buildHosts(hostsData, lineEndStr);
        const newContent = `${startStr}${lineEndStr}${lineEndStr}${newHostsData}${lineEndStr}${lineEndStr}# Update time: ${utime}${lineEndStr}${lineEndStr}${endStr}`;
        const regMatchQuicken = hostsContent.match(new RegExp(`${startStr}([\\s\\S]*)# Update time[\\s\\S]*${endStr}`));
        if (regMatchQuicken) {
            const oldHosts = regMatchQuicken ? regMatchQuicken[1].trim() : '';
            const needUpdate = oldHosts !== newHostsData.trim();
            logger.debug(needUpdate);
            if (!needUpdate) {
                return true;
            }
            const newHosts = hostsContent.replace(new RegExp(`${startStr}[\\s\\S]*?${endStr}`), newContent);
            logger.debug(newHosts);
            await setHosts(newHosts);
        } else {
            const newHosts = hostsContent + lineEndStr + newContent;
            logger.debug(newHosts);
            await setHosts(newHosts);
        }
        if (await cmd(flushDns, { name: 'flushDns' })) {
            logger.log('Local hosts updated successfully!');
            return true;
        } else {
            logger.error('Local hosts updated failed!');
            return false;
        }
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

function main(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        hostsUpdate().then(data => {
            logger.debug(data);
            return resolve(data);
        }).catch(e => {
            // logger.error(e);
            return reject(e as Error);
        });
    });
}

export { getHosts, main };

(async () => {
    if (typeof window === 'undefined') {
        main().then(data => {
            logger.log('Update hosts', data);
            if (data) {
                logger.info('Update success.');
            } else {
                logger.error('Update failed.');
            }
        }).catch(e => {
            logger.error(`Update failed.`, e);
        });
    }
})();