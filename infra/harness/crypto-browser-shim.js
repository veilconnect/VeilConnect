// 浏览器里替代 node 的 'crypto'。RatchetManager 只从中取 webcrypto 注入给 libsignal。
module.exports = { webcrypto: globalThis.crypto };
