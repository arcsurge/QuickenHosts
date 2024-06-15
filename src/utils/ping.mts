import { Socket } from 'net';
import { hrtime } from 'process';

interface Options {
    address: string;
    port: number;
    attempts: number;
    timeout: number;
}

interface Result {
    sequence: number;
    time?: number;
}

interface Summary {
    address: string;
    port: number;
    attempts: number;
    avg: number;
    max: number;
    min: number;
    results: Result[];
}

/**
 * 使用提供的选项连接到服务器，并使用结果调用回调函数。
 * @param options - 连接到服务器的选项。
 * @param sequence - 连接尝试的序列号。
 * @param callback - 用于调用连接结果的回调函数。
 */
function connect(options: Options, sequence: number, callback: (error: Error | null, result: Result) => void): void {
    // 创建一个新的套接字
    const socket = new Socket();
    // 记录开始时间
    const start = hrtime.bigint();
    // 连接到服务器
    socket.connect(options.port, options.address, () => {
        // 计算连接所需的时间
        const time = Number(hrtime.bigint() - start) / 1e6;
        // 销毁套接字
        socket.destroy();
        // 调用回调函数并传递结果
        callback(null, {sequence, time});
    });
    // 处理套接字错误
    socket.on('error', (error) => {
        // 销毁套接字
        socket.destroy();
        // 调用回调函数并传递错误和无穷大时间
        callback(error, {sequence, time: Infinity});
    });
    // 处理套接字超时
    socket.setTimeout(options.timeout, () => {
        // 销毁套接字
        socket.destroy();
        // 调用回调函数并传递请求超时错误和无穷大时间
        callback(new Error('请求超时'), {sequence, time: Infinity});
    });
}

/**
 * 返回一个带有 'address' 属性的选项对象。
 * 如果输入是一个字符串，则创建一个新的选项对象并将 'address' 属性设置为输入字符串。
 * 如果输入已经是一个选项对象，则返回输入对象。
 * @param options - 选项对象或表示地址的字符串。
 * @returns 带有 'address' 属性的选项对象。
 * @throws {Error} 如果输入不是字符串或带有 'address' 属性的对象，则抛出错误。
 */
function _options(options: Partial<Options> & Pick<Options, 'address'> | string): Partial<Options> & Pick<Options, 'address'> {
    // 检查输入是否是一个字符串
    if (typeof options === 'string') {
        // 创建一个新的选项对象，并将 'address' 属性设置为输入字符串
        return {
            address: options
        };
        // 检查输入是否是一个对象
    } else if (typeof options === 'object' && options !== null) {
        // 检查 'address' 属性是否是一个字符串
        if (typeof options.address === 'string') {
            // 返回输入对象
            return options;
            // 如果 'address' 属性缺失或不是一个字符串，则抛出错误
        } else {
            throw new Error('无效的选项：address 缺失或不是一个字符串');
        }
        // 如果输入不是字符串也不是对象，则抛出错误
    } else {
        throw new Error('无效的选项：必须是一个对象或字符串');
    }
}

/**
 * 根据选项和结果构建 ping 结果的摘要。
 *
 * @param options - 包含地址、端口和尝试次数的选项。
 * @param results - ping 结果的数组。
 * @returns ping 结果的摘要。
 */
function build(options: Pick<Options, 'address' | 'port' | 'attempts'>, results: Result[]): Summary {
    // 过滤掉结果中的 Infinity 时间
    const times: number[] = results.map(({time}) => time || 0).filter(t => t !== Infinity);
    // 计算总时间
    const total = times.reduce((sum: number, t: number) => sum + t, 0);

    // 计算平均时间、最大时间和最小时间
    const avg = total / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);
    // 返回摘要
    return {
        address: options.address!,
        port: options.port!,
        attempts: options.attempts!,
        avg,
        max,
        min,
        results
    };
}

/**
 * 对指定的地址和端口进行多次Ping操作。
 *
 * @param options - Ping的选项，包括地址、端口、尝试次数和超时时间。
 * @param callback - Ping完成后的回调函数，它接受两个参数：
 *                   错误（如果没有错误发生，则为null，否则为Error对象），
 *                   以及Ping结果的汇总数据。
 */
function ping(options: Partial<Options> & Pick<Options, 'address'> | string, callback: (error: Error | null, data: Summary | null) => void): void {
    const ops = _options(options)
    // 如果未提供选项，则设置默认选项
    const defaults: Options = {address: 'localhost', port: 80, attempts: 10, timeout: 5000};
    options = {...defaults, ...ops};
    // 初始化一个空数组来存储结果
    const results: Result[] = [];

    /**
     * 处理单次Ping尝试的结果。
     *
     * @param _ - 错误对象（如果没有错误发生，则为null）
     * @param result - Ping尝试的结果
     */
    const handle = (_: Error | null, result: Result) => {
        // 将结果存储在结果数组中
        results[result.sequence] = result;

        // 如果还有尝试次数剩余，则发起下一次Ping
        if (results.length < (options.attempts || 0)) {
            try {
                connect(options as Options, results.length, handle);
            } catch (error: Error | any) {
                callback(error, null);
            }
            return;
        }
        // 构建Ping结果的汇总数据，并调用回调函数
        const summary = build(options as Pick<Options, 'address' | 'port' | 'attempts'>, results);
        callback(null, summary);
    };
    // 发起第一次Ping尝试
    try {
        connect(options as Options, 0, handle);
    } catch (error: Error | any) {
        callback(error, null);
    }
}

/**
 * 异步地对服务器进行多次 ping 操作，并返回结果的汇总。
 * @param options - 可选的对象，包含要 ping 的服务器地址、端口、尝试次数和超时时间。
 * @returns 一个 Promise，在 ping 操作结束时解析为 ping 结果的汇总。
 * @throws 如果在 ping 过程中发生错误，则抛出错误。
 */
async function pingAsync(options: Partial<Options> & Pick<Options, 'address'> | string): Promise<Summary> {
    const ops = _options(options)
    // 如果没有提供选项，则设置默认选项
    const defaults: Options = {
        address: 'localhost',
        port: 80,
        attempts: 10,
        timeout: 5000
    };
    options = {...defaults, ...ops};

    // 创建一个包含多个 ping 尝试的 Promise 数组
    const promises: Promise<Result>[] = Array.from({length: options.attempts!}, (_, sequence) =>
        new Promise<Result>((resolve, reject) => {
            // 连接到服务器并根据结果解析或拒绝 Promise
            connect(options as Options, sequence, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        })
    );

    try {
        // 等待所有 Promise 结束并过滤掉被拒绝的 Promise
        const results = await Promise.allSettled(promises);
        const filteredResults = results.map((r, i) => r.status === 'fulfilled' ? r.value : {
            sequence: i,
            time: Infinity
        });
        // 构建并返回 ping 结果的汇总
        return build(options as Pick<Options, 'address' | 'port' | 'attempts'>, filteredResults);
    } catch (error) {
        // 如果在 ping 过程中发生错误，则抛出错误
        throw new Error(`在 pingAsync 中发生错误：${error}`);
    }
}

/**
 * 异步探测主机以检查是否可达。
 *
 * @param options - 探测的选项。可以是一个具有至少 `address` 属性的部分 `Options` 对象，或者是一个表示 `address` 属性的字符串。
 * @returns 一个解析为 `true` 表示主机可达，`false` 表示不可达的 Promise。
 * @throws 如果在 ping 过程中发生错误，则抛出错误。
 */
const probeAsync = async (options: Partial<Options> & Pick<Options, 'address'> | string): Promise<boolean> => {
    try {
        // 从选项中提取 `address` 属性，并使用其他属性的默认值创建一个新的 `Options` 对象。
        const opts = _options(options);
        // 执行一次 ping 请求。
        const result = await pingAsync({...opts, attempts: 1});
        // 检查结果是否有效。如果不是有效的结果，则记录错误并返回 false。
        if (result) {
            return result.min !== Infinity;
        } else {
            console.error('pingAsync 返回了 null 或 undefined');
            return false;
        }
    } catch (error) {
        // 记录在 ping 过程中发生的任何错误，并重新抛出错误。
        console.error('在 pingAsync 期间发生了错误：', error);
        throw new Error('在 pingAsync 期间发生了错误');
    }
};

/**
 * 检查网络地址是否可用，通过发送 ping 请求来实现。
 * @param options - 包含 ping 请求选项的对象。
 * @param callback - 用于处理 ping 请求结果的回调函数。
 * @throws 如果处理选项或调用回调函数时出现错误。
 */
const probe = (options: Partial<Options> & Pick<Options, 'address'> | string, callback: (err: Error | null, available: boolean) => void): void => {
    try {
        // 从 options 中提取 'address' 属性，并使用默认值创建一个新的 options 对象。
        const opts = _options(options);
        // 发送带有提供的选项的 ping 请求。
        ping({...opts, attempts: 1}, (err, r) => {
            try {
                let result = false;
                if (r) {
                    result = !err && r.min !== Infinity;
                } else {
                    console.error('pingAsync 返回了 null 或 undefined');
                }
                // 调用回调函数，并传递 ping 请求的结果。
                callback(err, result);
            } catch (error) {
                // 记录调用回调函数时出现的任何错误。
                console.error('调用回调函数时发生错误：', error);
            }
        });
    } catch (error) {
        // 记录处理选项时出现的任何错误。
        console.error('处理选项时发生错误：', error);
    }
};

export {
    probeAsync,
    probe,
    ping,
    pingAsync
}
