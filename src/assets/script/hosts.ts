import moment from 'moment';
import { headers } from "@/config/constants";
import {
    endStr,
    flushDns,
    hostsConfig,
    ipAddressBaseUrl,
    path as hostsPath,
    startStr
} from '@/config/hosts.config';
import { HostsData, HostsGroup, QuickenGroup } from "@/types/global";
import { getModules, getQuickenConfigs } from "@/assets/script/module";
import { copy, read, write } from "@/utils/fileUtil";
import { retrySync, lJust } from "@/utils/globalUtil";
import { cmd } from "@/utils/ShellScript";
import { getOptimalIp, isIP, request } from "@/utils/httpUtil";
import { logger } from "@/utils/JConsole";

const { path } = getModules();

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

function resolveUrl(host: string): string {
    return ipAddressBaseUrl + host;
}

async function getIPAddresses(host: string): Promise<string> {
    return await retrySync(async (website) => {
        const htmlContent = await request(resolveUrl(website), {}, { headers });
        const ipAddresses = extractIPAddresses(htmlContent);
        const ips = Array.from(new Set(ipAddresses));
        if (!ips || ips.length === 0) {
            throw new Error(`[${website}]' ip not found!'`);
        }
        return getOptimalIp(ips);
    }, 3, 1000, host);
}

async function getHostsData() {
    const groupHosts = await Promise.all(getQuickenConfigs().map(async (group: QuickenGroup) => {
        const promises = group.list.map(url => getIPAddresses(url));
        const results = await Promise.allSettled(promises);
        const hosts: HostsData[] = [];
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                if (isIP(result.value)) {
                    hosts.push({
                        name: group.list[index],
                        ip: result.value
                    });
                } else {
                    logger.error(`URL ${group.list[index]} rejected with reason: than IP`);
                }
            } else {
                logger.error(`URL ${group.list[index]} rejected with reason: ${result.reason}`);
            }
        });
        return {
            name: group.name,
            hosts
        };
    }));
    logger.debug(JSON.stringify(groupHosts));
    return groupHosts;
}

function hostsBackup(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const { filename, backup } = hostsConfig;
        copy(path.resolve(hostsPath, filename), path.resolve(hostsPath, backup), { admin: true }).then((data: boolean) => {
            logger.log(data ? 'Local hosts backup successfully!' : 'Local hosts backup failed!');
            resolve(data);
        }).catch(e => {
            // logger.error(e);
            reject(e as Error);
        });
    });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function hostsRestore(): Promise<boolean> {
    const { filename, backup } = hostsConfig;
    try {
        return await copy(path.resolve(hostsPath, backup), path.resolve(hostsPath, filename), { admin: true });
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

function setHosts(context: string): Promise<boolean> {
    const hostsFile = path.resolve(hostsPath, hostsConfig.filename);
    return write(hostsFile, context);
}

function buildHosts(hostsGroups: HostsGroup[], joinStr = '\n'): string {
    if (!hostsGroups || hostsGroups.length === 0) return '';
    return hostsGroups.map((item: HostsGroup) => {
        if (!item.hosts || item.hosts.length === 0) return '';
        return `#---- ${item.name} ----${joinStr}${item.hosts.map((host: HostsData) => lJust(host.ip, 20) + host.name).join(joinStr)}${joinStr}`;
    }).filter((item: string) => item.trim().length > 0).join(joinStr);
}
function checkData(data: string) {
    if (!data || data.trim().length < 1) throw Error('获取数据失败，请检查配置或网络设置！')
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
        const hostsData = await getHostsData();
        const newHostsData: string = buildHosts(hostsData, lineEndStr);
        logger.debug('newHostsData', newHostsData);
        checkData(newHostsData);
        const utime = moment().format('YYYY-MM-DD HH:mm:ss');
        const newContent = `${startStr}${lineEndStr}${lineEndStr}${newHostsData}${lineEndStr}# Update time: ${utime}${lineEndStr}${lineEndStr}${endStr}`;
        const oldHostsRegMatch = hostsContent.match(new RegExp(`${startStr}([\\s\\S]*)# Update time[\\s\\S]*${endStr}`));
        if (oldHostsRegMatch) {
            const oldHosts = oldHostsRegMatch ? oldHostsRegMatch[1].trim() : '';
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

export { getHosts, setHosts, main };

(async () => {
    if (typeof window === 'undefined') {
        main().then(data => {
            logger.log('Quicken hosts', data);
            if (data) {
                logger.info('Quicken success.');
            } else {
                logger.error('Quicken failed.');
            }
        }).catch(e => {
            logger.error(`Quicken failed.`, e);
        });
    }
})();
