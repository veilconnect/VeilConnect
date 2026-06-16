const path = require('path');
const webpack = require('webpack');

// 浏览器 bundle：把真实 RatchetManager(libsignal) + tweetnacl + 握手逻辑打成单个脚本，
// 由 Puppeteer 注入页面，挂到 window.VC。'crypto' 用浏览器 shim（只需 webcrypto）。
module.exports = {
  mode: 'production',
  target: 'web',
  entry: path.resolve(__dirname, 'browser-entry.ts'),
  output: {
    path: path.resolve(__dirname, '../../dist-harness'),
    filename: 'browser-bundle.js'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: { crypto: path.resolve(__dirname, 'crypto-browser-shim.js') },
    fallback: { crypto: false, buffer: require.resolve('buffer/'), stream: false, process: false, path: false, fs: false }
  },
  module: {
    rules: [{ test: /\.ts$/, use: [{ loader: 'ts-loader', options: { transpileOnly: true } }], exclude: /node_modules/ }]
  },
  plugins: [
    new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] })
  ],
  optimization: { minimize: false }
};
