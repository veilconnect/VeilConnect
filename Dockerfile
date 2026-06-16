# 多阶段构建：① 用根项目把网页 SPA + 加密 Worker 打包到 server/public；② 精简运行信令服务器。
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
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
