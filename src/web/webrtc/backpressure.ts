/**
 * DataChannel 背压等待 —— 从 SimpleP2PChat 抽出。
 *
 * 发送大文件时 bufferedAmount 会堆积；超过高水位就等到回落到低水位再继续，
 * 避免无界缓冲撑爆内存或拖垮连接。通道关闭或超时则 reject。
 */

export const FILE_BACKPRESSURE_HIGH = 1024 * 1024;
export const FILE_BACKPRESSURE_LOW = 256 * 1024;
export const FILE_BACKPRESSURE_TIMEOUT_MS = 120_000;
export const FILE_BACKPRESSURE_POLL_MS = 100;

export function waitForDataChannelBackpressure(channel: RTCDataChannel): Promise<void> {
  if (channel.bufferedAmount <= FILE_BACKPRESSURE_HIGH) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const previous = channel.onbufferedamountlow;
    let done = false;
    let poll: ReturnType<typeof setInterval> | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timer !== null) clearTimeout(timer);
      if (poll !== null) clearInterval(poll);
      channel.onbufferedamountlow = previous;
    };
    const finish = () => {
      if (done) return;
      done = true;
      cleanup();
      resolve();
    };
    const fail = (message: string) => {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error(message));
    };
    const check = () => {
      if (channel.readyState !== 'open') {
        fail('file transfer channel closed');
        return;
      }
      if (channel.bufferedAmount <= FILE_BACKPRESSURE_LOW) finish();
    };

    channel.bufferedAmountLowThreshold = FILE_BACKPRESSURE_LOW;
    channel.onbufferedamountlow = (event) => {
      if (typeof previous === 'function') previous.call(channel, event);
      finish();
    };
    poll = setInterval(check, FILE_BACKPRESSURE_POLL_MS);
    timer = setTimeout(() => fail('file transfer backpressure timeout'), FILE_BACKPRESSURE_TIMEOUT_MS);
    check();
  });
}
