const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

/**
 * 纯网页（自部署）构建：把 React UI + 加密 Web Worker 打成静态资源，输出到 server/public，
 * 由信令服务器（server/signaling-server.js）一并托管。
 *
 * 关键点：
 *  - 用 webpack alias 把 Node/Electron 依赖换成浏览器 shim（crypto / electron-store / electron）。
 *  - crypto-browserify 会用到 stream/buffer/process，故配 fallback + ProvidePlugin。
 *  - ts-loader 覆盖 module=esnext，使 `new Worker(new URL(..., import.meta.url))` 的
 *    import.meta 得以保留，让 webpack 自动产出 Worker chunk（无需 worker-loader）。
 */
module.exports = (env, argv) => {
  const isDev = argv && argv.mode === 'development';
  return {
    target: 'web',
    entry: './src/web/index.tsx',
    output: {
      // 默认输出网页栈的 server/public；桌面端构建用 --env outDir=dist/renderer 改输出目录。
      path: path.resolve(__dirname, (env && env.outDir) || 'server/public'),
      filename: isDev ? '[name].js' : '[name].[contenthash].js',
      // 桌面端用 file:// 加载，publicPath 必须相对（'/' 会指向文件系统根而 404）。
      publicPath: (env && env.outDir) ? './' : '/',
      clean: true
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      alias: {
        // Node/Electron → 浏览器 shim（详见 src/web/shims/*）
        crypto: path.resolve(__dirname, 'src/web/shims/crypto-shim.js'),
        'electron-store': path.resolve(__dirname, 'src/web/shims/electron-store-shim.ts'),
        electron: false,
        '@': path.resolve(__dirname, 'src'),
        '@renderer': path.resolve(__dirname, 'src/renderer'),
        '@main': path.resolve(__dirname, 'src/main')
      },
      fallback: {
        // crypto-browserify 依赖
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
        process: require.resolve('process/browser'),
        // 浏览器不需要的 Node 核心模块
        fs: false,
        path: false,
        net: false,
        tls: false,
        vm: false
      }
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                compilerOptions: {
                  // 覆盖根 tsconfig 的 module=Node16：用 esnext 保留 import.meta（Worker 需要）
                  module: 'esnext',
                  moduleResolution: 'node',
                  noEmit: false
                }
              }
            }
          ]
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'src/renderer/index.html'),
        inject: 'body'
      }),
      // 构建期注入信令/TURN 默认地址：托管版（如 Cloudflare Pages）用 VC_SIGNALING_URL /
      // VC_TURN_ENDPOINT 指向独立的信令 Worker；自部署版不设 → 留空 → 运行时回退同源（同一服务器托管信令）。
      new webpack.DefinePlugin({
        __VC_SIGNALING_URL__: JSON.stringify(process.env.VC_SIGNALING_URL || ''),
        __VC_TURN_ENDPOINT__: JSON.stringify(process.env.VC_TURN_ENDPOINT || '')
      }),
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser'
      })
    ],
    devServer: {
      port: 8080,
      hot: true,
      static: false,
      historyApiFallback: true
    },
    performance: { hints: false }
  };
};
