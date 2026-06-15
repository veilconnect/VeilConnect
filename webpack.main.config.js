const path = require('path');

module.exports = [
  // 主进程配置
  {
    target: 'electron-main',
    entry: './src/main/main.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'main.js'
    },
    resolve: {
      extensions: ['.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@main': path.resolve(__dirname, 'src/main'),
        '@shared': path.resolve(__dirname, 'src/shared')
      }
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    node: {
      __dirname: false,
      __filename: false
    },
    externals: {
      'sqlite3': 'commonjs sqlite3'
    }
  },
  // Preload脚本配置
  {
    target: 'electron-preload',
    entry: './src/main/preload.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'preload.js'
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    node: {
      __dirname: false,
      __filename: false
    }
  }
]; 