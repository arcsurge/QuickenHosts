import { AnyObject } from "@/types/global";
import { getModules } from "@/assets/script/module";

export const hostsConfig: AnyObject = {
    filename: 'hosts',
    backup: 'hosts.bak',
    osMap: {
        darwin: {
            name: 'MacOS',
            path: '/etc',
            copyShell: 'cp -f',
            flushDns: 'killall -HUP mDNSResponder'
        },
        linux: {
            name: 'Linux',
            path: '/etc',
            copyShell: 'cp -f',
            flushDns: '/etc/init.d/nscd restart'
        },
        win32: {
            name: 'Windows',
            path: 'C:/Windows/System32/drivers/etc',
            copyShell: 'copy',
            flushDns: 'ipconfig /flushdns'
        }
    }
}

export const githubUrls: string[] = [
    'alive.github.com', 'api.github.com', 'assets-cdn.github.com',
    'avatars.githubusercontent.com', 'avatars0.githubusercontent.com',
    'avatars1.githubusercontent.com', 'avatars2.githubusercontent.com',
    'avatars3.githubusercontent.com', 'avatars4.githubusercontent.com',
    'avatars5.githubusercontent.com', 'camo.githubusercontent.com',
    'central.github.com', 'cloud.githubusercontent.com', 'codeload.github.com',
    'collector.github.com', 'desktop.githubusercontent.com', 'education.github.com',
    'favicons.githubusercontent.com', 'gist.github.com', 'github-cloud.s3.amazonaws.com',
    'github-com.s3.amazonaws.com', 'github-production-release-asset-2e65be.s3.amazonaws.com',
    'github-production-repository-file-5c1aeb.s3.amazonaws.com',
    'github-production-user-asset-6210df.s3.amazonaws.com', 'github.blog',
    'github.com', 'github.community', 'github.githubassets.com',
    'github.global.ssl.fastly.net', 'github.io', 'github.map.fastly.net',
    'githubstatus.com', 'live.github.com', 'media.githubusercontent.com',
    'objects.githubusercontent.com', 'pipelines.actions.githubusercontent.com',
    'raw.githubusercontent.com', 'user-images.githubusercontent.com',
    'vscode.dev'
]

export const ipAddressBaseUrl: string = 'https://sites.ipaddress.com/';

const { process } = getModules();

export const { platform } = process;

export const { path, flushDns, copyShell } = hostsConfig.osMap[platform]

export const startStr: string = '#------ Quicken Hosts Start ------'

export const endStr: string = '#------ Quicken Hosts End ------'
