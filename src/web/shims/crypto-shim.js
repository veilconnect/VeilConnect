// 浏览器版 'crypto' 替身（经 webpack alias 注入，替换 Node 的 'crypto'）。
//
// 两类消费方：
//  1. RatchetManager 只取 `webcrypto` 注入给 libsignal —— 用浏览器原生 globalThis.crypto。
//  2. IdentityManager 取 createHash / pbkdf2Sync / randomBytes / createCipheriv / createDecipheriv
//     —— 由 crypto-browserify（含 browserify-aes，支持 aes-256-gcm 的 getAuthTag/setAuthTag）提供，
//     全部同步，满足 IdentityManager 对同步 API 的依赖（pbkdf2Sync 在 Web Worker 内执行，不会卡 UI）。
//
// 注意：本文件在 Web Worker 与主线程都可能被加载；globalThis.crypto 在两种环境均可用。
const browserCrypto = require('crypto-browserify');

module.exports = Object.assign({}, browserCrypto, {
  webcrypto: globalThis.crypto
});
