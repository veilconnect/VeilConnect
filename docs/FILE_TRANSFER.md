# 文件传输架构与限制（File Transfer）

VeilConnect 有**两条**文件传输路径,定位不同。本文档记录其设计、实测表现与已知限制,
便于后续维护(很多数字是实测/平台硬限,不写下来容易踩坑)。

## 1. 聊天内 P2P 直传（WebRTC DataChannel）

- 路径:发送端 → WebRTC 数据通道 → 接收端,**端到端**(不经服务器存储)。
- 每个文件一把一次性 AES-256-GCM 密钥,经 Double Ratchet 控制消息下发;分块各自随机 IV + 认证标签。
- 接收端重组后校验 **字节数 + 全文件 SHA-256**,一致才标「已完成」。

### 关键参数 / 取舍
- **分块 = 8 KiB,二进制帧**(`src/web/fileTransfer/fileTransfer.ts: DEFAULT_CHUNK_SIZE`)。
  - 早先 64 KiB + JSON/base64 → 单条消息 ~85 KiB,**经 TURN(尤其 TCP)中继时大消息会卡死**
    (文本类小消息正常,大分块收不全)。WebRTC 跨端互操作建议单条 ≤ **16 KiB**。
  - 改二进制帧(`packChunkFrame`/`unpackChunkFrame`,免 base64 +33% 膨胀)后单条 ~15 KiB 仍 ≤16 KiB。
  - 注意:**分块帧格式变更需收发双方同版本**(网页端刷新即一致;桌面端 v2.0.6 起对齐)。
- **relayOnly 默认开启**(`src/web/webrtc/iceConfig.ts`,`localStorage 'vc.relayOnly'!=='0'` 才关):
  只用 TURN relay 候选,**隐藏双方真实 IP**(邀请码 SDP 里也不含真实 IP)。隐私优先。
- **单文件上限 100 MiB**(`MAX_FILE_SIZE`):当前实现**整文件读入内存 + 算哈希**,接收端也在内存重组,
  峰值约 2~3×文件大小,为保护低内存设备(手机)设的保守红线。>100MB 会被优雅拒绝(提示"文件超过 100MB 上限")。

### 实测表现（.12 ↔ napa,经生产 Cloudflare TURN relay）
- 文本/小文件:即时。
- 文件吞吐 **~80–150 KB/s 且波动大**(10MB 实测 67–125s);**瓶颈是中继链路,不是分帧**。
- 直连(关 relayOnly)通常快很多,但**会向对方暴露真实 IP**,且对称 NAT/严格防火墙下可能直连不上
  → 故不作默认。真正提速需**部署地理就近的 TURN 节点**(运维层面)。

## 2. 网盘式异步文件（R2,"链接即密钥"）

- 路径:发送端本地加密 → 上传**密文**到 R2(经信令 Worker)→ 把密钥放进分享链接的 `#片段`(绝不发服务器)。
  接收端打开链接 → 下载密文 → 本地解密。**对方不在线也能传**,不经 P2P 中继(走服务器带宽,通常更快)。
- 可选「提取密码」:内容密钥 = HKDF(链接随机密钥, 密码)。链接泄露但密码未泄露时仍安全。
- 服务器只存**密文 + 大小/过期**;文件名/类型也加密在头里。blob 有 TTL(默认 24h)自动过期 + R2 生命周期兜底删。

### 容器格式 VCB2（流式分块,`src/web/blob/blobTransfer.ts`）
```
magic 'VCB2'(4) | headerLen(4 BE) | headerIv(12)+headerCipher
重复 totalChunks 次: chunkLen(4 BE) | chunkIv(12)+chunkCipher
  header = AES-GCM(JSON{name,mime,size,chunkSize,totalChunks}, AAD='VCB2:hdr')
  第 i 块 = AES-GCM(明文片, AAD=uint32BE(i))  # AAD 绑定块序,防重排/重放;header 的 size/totalChunks 解密后校验,防截断
```
- 发送端按 **1 MiB** 片读+逐块加密+**流式上传**(不整文件入内存)。
- Worker 把 `request.body` **直接流给 R2**(不再 `arrayBuffer()`,避免 128MB OOM),落库后按 R2 实际大小复核上限。
- 接收端逐块解密:支持 **File System Access API** 时边解边写盘(不占内存)+ 进度;否则回退内存 Blob。

### ⚠️ 硬限制:托管版单次上传 ≈ 95 MB
- **Cloudflare Workers 请求体上限 100 MB**(本账户套餐)。>100MB 会被**边缘**直接拒(返回无 CORS 头的 413,
  浏览器表现为 `ERR_FAILED`/CORS 报错)。**流式也绕不过**——这是请求体大小限制,非内存问题。
- 故客户端对指向托管 Worker 的 >95MB 文件**直接拦下并清晰提示**(`blobTooLarge`,四语);`BLOB_MAX_MB=95`。
- 自部署(同源 Node 服务器)不受此限,由 Node 端 `BLOB_MAX_MB` 控制。
- 实测:**90 MB 端到端通过**(流式上传 + 流式下载 + 每块 GCM/总大小校验 = 字节无损)。

### 想支持 >100MB(GB 级):R2 multipart(待实现)
把文件切成多个 <100MB 分片,多次请求分别上传到一个 R2 multipart 任务,最后合并。
需给 Worker 加 create / upload-part / complete 三个端点 + 客户端编排。**当前决定:暂不做,保持 ~95MB 上限。**

## 配置开关速查
| 项 | 位置 | 默认 |
|---|---|---|
| P2P 分块大小 | `DEFAULT_CHUNK_SIZE` | 8 KiB |
| P2P 单文件上限 | `MAX_FILE_SIZE` | 100 MiB |
| relayOnly(隐藏 IP) | `localStorage 'vc.relayOnly'` | 开(`'0'` 关) |
| 网盘 blob 上限 | Worker `BLOB_MAX_MB` / 客户端 `HOSTED_BLOB_MAX_BYTES` | 95 MB |
| 网盘 blob TTL | Worker `BLOB_TTL_H` | 24h |
| 网盘块大小 | `STREAM_CHUNK_SIZE` | 1 MiB |
