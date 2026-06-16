const path = require('path');

// 把 harness 及其依赖（真实的 IdentityManager/CryptoManager/RatchetManager + libsignal + tweetnacl）
// 打成单个 CJS 文件，便于 scp 到远端运行。node-datachannel 是原生模块，保持 external，运行时从
// node_modules 解析；electron-store 用内存 mock 顶替（harness 不需要持久化），从而摆脱 electron 依赖。
module.exports = {
  mode: 'production',
  target: 'node',
  entry: path.resolve(__dirname, 'p2p-harness.ts'),
  output: {
    path: path.resolve(__dirname, '../../dist-harness'),
    filename: 'p2p-harness.js'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      'electron-store': path.resolve(__dirname, '../../tests/__mocks__/electron-store.ts')
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [{ loader: 'ts-loader', options: { transpileOnly: true } }],
        exclude: /node_modules/
      }
    ]
  },
  externals: {
    'node-datachannel': 'commonjs node-datachannel',
    'node-datachannel/polyfill': 'commonjs node-datachannel/polyfill'
  },
  optimization: { minimize: false }
};
