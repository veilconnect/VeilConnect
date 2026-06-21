#!/usr/bin/env node
/**
 * 子资源完整性（SRI）生成器 —— 让「下发的网页脚本」可被验证，缩小浏览器端 E2EE 的信任边界。
 *
 * 做两件事：
 *   1. 给 server/public/index.html 里所有【本地】<script src> / <link rel=stylesheet> 注入
 *      integrity="sha384-..."（浏览器会拒绝执行哈希不符的脚本，使「服务器偷换 JS」当场失败）。
 *   2. 把每个产物文件名 → sha384 写入 server/public/sri-manifest.json，并附在 docs 公示，
 *      供用户/审计者比对官方发布哈希（可复现构建的核对锚点）。
 *
 * 用法：
 *   node scripts/gen-sri.js          # 计算并写回 index.html + 生成 manifest（构建后自动跑）
 *   node scripts/gen-sri.js --check  # 仅校验：现有产物哈希是否与 index.html 中已注入的一致（CI 用）
 *
 * 仅用 Node 内置模块。产物目录不存在时安全退出 0（如未构建的纯单测环境）。
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PUBLIC_DIR = path.join(__dirname, '..', 'server', 'public');
const INDEX = path.join(PUBLIC_DIR, 'index.html');
const MANIFEST = path.join(PUBLIC_DIR, 'sri-manifest.json');
const checkMode = process.argv.includes('--check');

function sha384(buf) {
  return 'sha384-' + crypto.createHash('sha384').update(buf).digest('base64');
}

function localAssetIntegrity(file) {
  const abs = path.join(PUBLIC_DIR, file);
  if (!fs.existsSync(abs)) return null;
  return sha384(fs.readFileSync(abs));
}

function main() {
  if (!fs.existsSync(INDEX)) {
    console.log('[sri] server/public/index.html 不存在（尚未构建），跳过。');
    return 0;
  }

  let html = fs.readFileSync(INDEX, 'utf8');
  const manifest = {};
  let changed = false;
  let mismatch = false;

  // 匹配本地 <script src="..."> 与 <link rel="stylesheet" href="...">（跳过 http(s):// 外链）。
  const tagRe = /<(script)\b[^>]*\bsrc="([^"]+)"[^>]*>|<(link)\b[^>]*\bhref="([^"]+)"[^>]*>/g;
  html = html.replace(tagRe, (full, _s, src, _l, href) => {
    const url = src || href;
    if (!url || /^https?:\/\//i.test(url) || url.startsWith('data:')) return full;
    if (_l && !/rel="stylesheet"/i.test(full)) return full; // 只处理样式表 link
    const file = url.replace(/^\.?\//, '').split('?')[0];
    const integrity = localAssetIntegrity(file);
    if (!integrity) return full;
    manifest[file] = integrity;

    const existing = full.match(/integrity="([^"]+)"/);
    if (existing) {
      if (existing[1] !== integrity) {
        mismatch = true;
        if (!checkMode) {
          changed = true;
          return full.replace(/integrity="[^"]+"/, `integrity="${integrity}"`);
        }
      }
      return full;
    }
    // 注入 integrity + crossorigin（同源也需 crossorigin 以启用 SRI 校验语义）。
    changed = true;
    const withCross = /crossorigin/i.test(full) ? full : full.replace(/(\/?)>$/, ' crossorigin="anonymous"$1>');
    return withCross.replace(/(\/?)>$/, ` integrity="${integrity}"$1>`);
  });

  if (checkMode) {
    if (mismatch) {
      console.error('[sri] ✗ index.html 中的 integrity 与产物实际哈希不符，请重跑 `npm run sri`。');
      return 1;
    }
    console.log('[sri] ✓ 校验通过：注入的 integrity 与产物一致。');
    return 0;
  }

  if (changed) fs.writeFileSync(INDEX, html);
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  const n = Object.keys(manifest).length;
  console.log(`[sri] 已为 ${n} 个本地资源写入 integrity，并生成 sri-manifest.json。`);
  return 0;
}

process.exit(main());
