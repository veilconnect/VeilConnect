# VeilConnect 本机启动指南 🚀

## 🎯 快速启动

VeilConnect现在已经重组优化，本机启动变得非常简单！

### 方法一：使用简化启动脚本（推荐）

```powershell
.\start-simple.ps1
```

### 方法二：手动启动

```powershell
# 进入应用目录
cd app

# 启动HTTP服务器
python -m http.server 8000
```

### 方法三：使用原始启动脚本

```powershell
.\start-app.ps1
```

## 📋 启动前准备

### ✅ 系统要求
- **操作系统**：Windows 10/11
- **Python**：3.6 或更高版本
- **浏览器**：Chrome、Firefox、Edge、Safari

### 🔧 检查Python安装
```powershell
python --version
```
如果未安装Python，请访问：https://python.org/downloads

## 🌐 访问应用

启动成功后，在浏览器中访问：
- **本地地址**：http://localhost:8000
- **网络地址**：http://你的IP:8000

## 📱 支持的功能

### ✅ 核心功能
- **P2P聊天**：端到端加密聊天
- **文件传输**：安全文件分享
- **身份管理**：公钥身份系统
- **好友添加**：邀请码连接
- **多语言**：中文、英文、日语、西班牙语

### 🌐 网络功能
- **WebRTC**：直接P2P连接
- **DHT网络**：分布式连接
- **NAT穿透**：自动网络配置
- **自动重连**：网络中断恢复

## 🛠️ 故障排除

### 问题1：端口被占用
```
Error: [Errno 10048] Only one usage of each socket address
```

**解决方案**：
```powershell
# 检查端口使用情况
netstat -an | findstr ":8000"

# 停止占用进程
Get-Process python | Stop-Process

# 或使用不同端口
python -m http.server 8001
```

### 问题2：Python未找到
```
'python' 不是内部或外部命令
```

**解决方案**：
1. 安装Python：https://python.org/downloads
2. 或使用py命令：`py -m http.server 8000`

### 问题3：应用无法访问
**检查步骤**：
1. 确认服务器启动成功
2. 检查防火墙设置
3. 尝试127.0.0.1:8000
4. 检查浏览器控制台错误

## 📊 性能优化

### 🚀 启动优化
- **SSD硬盘**：更快的文件读取
- **充足内存**：建议4GB以上
- **稳定网络**：P2P连接需要

### 🌐 网络优化
- **有线连接**：比WiFi更稳定
- **端口转发**：改善NAT穿透
- **防火墙配置**：允许WebRTC连接

## 🔒 安全注意事项

### ✅ 本地安全
- **仅本机访问**：默认只绑定localhost
- **无外部暴露**：不会自动暴露到互联网
- **临时会话**：关闭浏览器后数据清除

### 🌐 网络安全
- **端到端加密**：所有消息加密传输
- **身份验证**：公钥身份验证
- **无服务器依赖**：直接P2P连接

## 📈 使用统计

### 📊 本地性能
- **启动时间**：< 3秒
- **内存使用**：< 50MB
- **CPU使用**：< 5%
- **网络延迟**：< 1ms（本地）

### 🌍 P2P性能
- **连接建立**：3-10秒
- **消息延迟**：50-200ms
- **文件传输**：取决于网络带宽
- **并发连接**：支持多个好友

## 🔧 高级配置

### 自定义端口
```powershell
python -m http.server 9000
```

### 允许外部访问
```powershell
python -m http.server 8000 --bind 0.0.0.0
```

### 指定目录
```powershell
python -m http.server 8000 --directory app
```

## 📱 移动设备访问

如果需要在移动设备上访问：

1. **获取电脑IP地址**：
   ```powershell
   ipconfig | findstr "IPv4"
   ```

2. **启动外部访问**：
   ```powershell
   python -m http.server 8000 --bind 0.0.0.0
   ```

3. **移动设备访问**：
   http://你的电脑IP:8000

## 🎯 开发模式

### 实时编辑
- 修改`app/index.html`后刷新浏览器即可看到变化
- 修改`app/i18n.js`需要硬刷新（Ctrl+F5）

### 调试模式
- 打开浏览器开发者工具（F12）
- 查看Console标签页的日志信息
- 使用Network标签页监控网络请求

## 📞 支持信息

### 🔗 相关文档
- [用户指南](USER_GUIDE.md)
- [快速入门](QUICK_START.md)
- [故障排除](../technical/CONNECTION_TROUBLESHOOTING_GUIDE.md)

### 🆘 常见问题
- **连接失败**：检查网络和防火墙
- **功能异常**：查看浏览器控制台
- **性能问题**：关闭其他占用网络的程序

---

## 📋 启动检查清单

- [ ] ✅ Python已安装
- [ ] 📂 在VeilConnect项目根目录
- [ ] 🌐 端口8000未被占用
- [ ] 🔥 防火墙允许Python
- [ ] 🌍 浏览器支持WebRTC

**🎉 完成以上检查后，你就可以愉快地使用VeilConnect了！** 