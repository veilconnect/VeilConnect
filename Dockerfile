# 多阶段构建：① 用根项目把网页 SPA + 加密 Worker 打包到 server/public；② 精简运行信令服务器。
FROM node:20-bookworm-slim AS builder
WORKDIR /app
# --omit=optional 跳过仅测试用的重型原生依赖（puppeteer 下 Chromium / node-datachannel cmake 源码编译），
# slim 镜像无 tar/unzip/编译工具会令其失败；构建网页 SPA 用不到它们。
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
COPY package.json package-lock.json ./
RUN npm ci --omit=optional --no-audit --no-fund
COPY tsconfig.json webpack.web.config.js ./
COPY src ./src
RUN npm run build:web

FROM node:20-bookworm-slim AS runtime
WORKDIR /app/server
ENV NODE_ENV=production
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/ ./
# 用构建产物覆盖 public（信令服务器 express.static 托管它 + SPA 回退）
COPY --from=builder /app/server/public ./public
EXPOSE 3001
CMD ["node", "signaling-server.js"]
