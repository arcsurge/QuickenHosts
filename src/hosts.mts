import path from 'path';
import moment from 'moment';
import { headers } from "./config/constants.mjs";
import {
    startStr,
    endStr,
    hostsConfig,
    path as hostsPath,
    githubUrls,
    ipAddressBaseUrl,
    flushDns
} from './config/hosts.config.mjs';
import { pingAsync } from "./utils/ping.mjs";
import { HostsData } from "./config/types.mjs";
import { cmd } from "./utils/ShellScript.mjs";
import { JConsole } from "./utils/JConsole.mjs";
import chalk from "chalk";
import { request } from "./utils/httpUtil.mjs";
import { lJust, retrySync } from "./utils/globalUtil.mjs";
import { copy, read, write } from "./utils/fileUtil.mjs";

console = new JConsole(console);

async function getOptimalIp(ips: string[]) {
    type PingResult = {
        address: string,
        avg: number;
    };
    if (ips.length === 1) {
        return ips[0];
    }
    const results = await Promise.allSettled(ips.map(ip => pingAsync(ip).then(r => ({
        address: ip,
        avg: Number.isNaN(r.avg) ? Infinity : r.avg
    }))));

    // 过滤掉失败的ping请求
    return results.filter(r => r.status === 'fulfilled')
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
                console.error(`URL ${githubUrls[index]} rejected with reason: than IP`);
            }
        } else {
            console.error(`URL ${githubUrls[index]} rejected with reason: ${result.reason}`);
        }
    });
    console.debug(hosts);
    return hosts;
}

async function hostsBackup() {
    const { filename, backup } = hostsConfig;
    try {
        const { data: isCopy } = await copy(path.resolve(hostsPath, filename), path.resolve(hostsPath, backup));
        return !!isCopy;
    } catch (e: Error | any) {
        console.error(e.error);
        return false;
    }
}

async function hostsRestore() {
    const { filename, backup } = hostsConfig;
    try {
        const { data: isCopy } = await copy(path.resolve(hostsPath, backup), path.resolve(hostsPath, filename));
        return !!isCopy;
    } catch (e: Error | any) {
        console.error(e.error);
        return false;
    }
}

function buildHosts(hosts: HostsData[], joinStr = '\n'): string {
    return hosts.map((host: HostsData) => lJust(host.ip, 20) + host.name).join(joinStr);
}

async function hostsUpdate() {
    if (!await hostsBackup()) {
        return;
    }
    const hostsFile: string = path.resolve(hostsPath, hostsConfig.filename);
    const { data: hostsContent } = await read(hostsFile);
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
        console.debug(needUpdate);
        if (!needUpdate) {
            return;
        }
        const newHosts = hostsContent.replace(new RegExp(`${startStr}[\\s\\S]*?${endStr}`), newContent);
        console.debug(newHosts);
        await write(hostsFile, newHosts);
    } else {
        const newHosts = hostsContent + lineEndStr + newContent;
        console.debug(newHosts);
        await write(hostsFile, newHosts);
    }
    cmd(flushDns, { name: 'flushDns' }).then((_) => {
        console.log(chalk.green('Local hosts updated successfully!'));
    });
}

hostsUpdate().catch(error => {
    console.error(error);
});
