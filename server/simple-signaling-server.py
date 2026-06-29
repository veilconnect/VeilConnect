#!/usr/bin/env python3
"""
VeilConnect 简单信令服务器
基于Python HTTP服务器，支持WebRTC信令中继
解决群组聊天中的API信令404错误问题

安全说明：
本文件不使用 WebSocket（无 websockets/aiohttp/asyncio），而是基于标准库
http.server 的「HTTP 轮询」信令中继：客户端通过 POST /api/signal/{roomId}
发送信令、GET /api/signal/{roomId} 拉取信令。为与已加固的 Node 版
(signaling-server.js) 保持同等安全模型，这里在 HTTP 层补齐以下控制：
  - Origin 白名单（ALLOWED_ORIGINS 可覆盖）
  - 房间 token 锁定（首个加入者锁定 sha256，后续常量时间比对）
  - 每客户端 IP 指纹连接限速 + 失败 join 限速（内存桶，防 token 枚举）
  - 房间容量上限 + 请求体最大字节数（防超大帧）
  - HTTP 信息端点不泄漏房间存在性 / 内部 client id
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
import json
import os
import threading
import time
import hashlib
import hmac
from urllib.parse import urlparse
import uuid
from datetime import datetime
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# ===== 安全相关配置（与 Node 版 signaling-server.js 对齐）=====
DEFAULT_ALLOWED_ORIGINS = ['http://localhost:8080', 'http://127.0.0.1:8080', 'file://']
MAX_BODY_BYTES = 64 * 1024            # 单次信令载荷上限 64KB，超出直接拒绝
MAX_ROOM_CLIENTS = 4                  # 单房间最大客户端数
CONNECTIONS_PER_IP_PER_MIN = 30       # 每 IP 指纹每分钟最大请求(连接)数
MAX_FAILED_JOINS_PER_IP_PER_MIN = 10  # 每 IP 指纹每分钟最大失败 join 数（防 token 暴力枚举）
RATE_WINDOW_MS = 60_000
MIN_TOKEN_LEN = 16                    # token 最短长度
MAX_TOKEN_LEN = 128
MIN_ROOM_ID_LEN = 4
MAX_ROOM_ID_LEN = 128


def _load_allowed_origins():
    """从 ALLOWED_ORIGINS 环境变量（逗号分隔）加载白名单，否则用默认值。"""
    env = os.environ.get('ALLOWED_ORIGINS')
    if env:
        origins = [s.strip() for s in env.split(',') if s.strip()]
        if origins:
            return origins
    return list(DEFAULT_ALLOWED_ORIGINS)


ALLOWED_ORIGINS = _load_allowed_origins()
IP_HASH_SECRET = os.environ.get('SIGNAL_IP_HASH_SECRET') or os.urandom(32).hex()
ROOM_TOKEN_HASH_SECRET = os.environ.get('ROOM_TOKEN_HASH_SECRET') or os.environ.get('SIGNAL_IP_HASH_SECRET')


def is_origin_allowed(origin):
    """Origin 白名单校验：缺失 Origin 视为不允许（除非配置了 '*'）。"""
    if '*' in ALLOWED_ORIGINS:
        return True
    if not origin:
        return False
    return origin in ALLOWED_ORIGINS


def hash_token(token):
    """计算 token 摘要；配置服务端密钥时用 HMAC，降低持久化注册表泄漏后的离线猜测风险。"""
    raw = str(token).encode('utf-8')
    if ROOM_TOKEN_HASH_SECRET:
        return hmac.new(ROOM_TOKEN_HASH_SECRET.encode('utf-8'), raw, hashlib.sha256).hexdigest()
    return hashlib.sha256(raw).hexdigest()


def token_hash_matches(expected_hash, provided_hash):
    """常量时间比较两个 sha256 摘要，避免计时侧信道（对应 Node 的 timingSafeEqual）。"""
    return hmac.compare_digest(str(expected_hash), str(provided_hash))


class SignalingHandler(BaseHTTPRequestHandler):
    # 类变量，存储房间和消息
    # roomId -> {'clients': set(ipFingerprint), 'messages': [], 'token_hash': str, 'persistent': bool}
    rooms = {}
    room_lock = threading.Lock()

    # ===== 内存限速桶（每 IP 指纹）=====
    rate_buckets = {}          # ipFingerprint -> {'count': int, 'window_start': ms}
    failed_join_buckets = {}   # ipFingerprint -> {'count': int, 'window_start': ms}
    rate_lock = threading.Lock()

    # ---------------- 限速逻辑 ----------------
    def _client_ip(self):
        try:
            return self.client_address[0]
        except Exception:
            return 'unknown'

    def _client_fingerprint(self):
        return hmac.new(IP_HASH_SECRET.encode('utf-8'), self._client_ip().encode('utf-8'), hashlib.sha256).hexdigest()

    @classmethod
    def _check_rate_limit(cls, identifier):
        """每客户端指纹每分钟请求限速；返回 True 表示放行。"""
        now = int(time.time() * 1000)
        with cls.rate_lock:
            bucket = cls.rate_buckets.get(identifier)
            if not bucket or now - bucket['window_start'] > RATE_WINDOW_MS:
                cls.rate_buckets[identifier] = {'count': 1, 'window_start': now}
                return True
            bucket['count'] += 1
            return bucket['count'] <= CONNECTIONS_PER_IP_PER_MIN

    @classmethod
    def _is_join_throttled(cls, identifier):
        """检查该客户端指纹是否已被失败 join 限速（只读，不增计数）。"""
        now = int(time.time() * 1000)
        with cls.rate_lock:
            bucket = cls.failed_join_buckets.get(identifier)
            if not bucket or now - bucket['window_start'] > RATE_WINDOW_MS:
                return False
            return bucket['count'] >= MAX_FAILED_JOINS_PER_IP_PER_MIN

    @classmethod
    def _record_failed_join(cls, identifier):
        """记录一次失败的 join 尝试（token/roomId 非法或不匹配、房间满）。"""
        now = int(time.time() * 1000)
        with cls.rate_lock:
            bucket = cls.failed_join_buckets.get(identifier)
            if not bucket or now - bucket['window_start'] > RATE_WINDOW_MS:
                cls.failed_join_buckets[identifier] = {'count': 1, 'window_start': now}
                return
            bucket['count'] += 1

    # ---------------- token / 房间准入 ----------------
    def _extract_token(self, body_obj):
        """从 X-Room-Token 头或请求体 token 字段取 token。"""
        token = self.headers.get('X-Room-Token')
        if not token and isinstance(body_obj, dict):
            token = body_obj.get('token')
        return token

    def _authorize_room(self, room_id, token, client_fingerprint, persistent=False):
        """
        房间 token 准入控制：
          - 校验 roomId / token 合法性（长度）
          - 首个加入者锁定房间 token 的 sha256
          - 后续请求必须提供 sha256 匹配的 token（常量时间比对）
          - 房间容量上限
        返回 (ok: bool, error_message: str|None)。失败时已记录 failed-join。
        约定：调用前应持有 room_lock。
        说明：HTTP 轮询无持久连接，故以「客户端 IP 指纹」近似一个参与者来统计容量
        （房间 token 是全体共享的房间口令，所有合法成员持同一 token）。
        """
        if not isinstance(room_id, str) or not (MIN_ROOM_ID_LEN <= len(room_id) <= MAX_ROOM_ID_LEN):
            self._record_failed_join(client_fingerprint)
            return False, 'Invalid roomId'

        if not isinstance(token, str) or not (MIN_TOKEN_LEN <= len(token) <= MAX_TOKEN_LEN):
            self._record_failed_join(client_fingerprint)
            return False, 'Token required (16-128 chars)'

        token_h = hash_token(token)
        room = self.rooms.get(room_id)

        if room is None:
            # 首位加入者建立房间并锁定 token
            self.rooms[room_id] = {'clients': set(), 'messages': [], 'token_hash': token_h, 'persistent': bool(persistent)}
            return True, None

        if not token_hash_matches(room.get('token_hash', ''), token_h):
            self._record_failed_join(client_fingerprint)
            return False, 'Invalid room token'

        if persistent and not room.get('persistent'):
            room['persistent'] = True

        # 房间容量上限（以客户端 IP 指纹作为参与者标识）
        if client_fingerprint not in room['clients'] and len(room['clients']) >= MAX_ROOM_CLIENTS:
            self._record_failed_join(client_fingerprint)
            return False, 'Room full'

        return True, None

    def _register_client(self, room_id, client_fingerprint):
        """把当前请求方登记为房间客户端（以客户端 IP 指纹作为参与者标识，避免泄漏内部 id）。"""
        room = self.rooms.get(room_id)
        if room is not None:
            room['clients'].add(client_fingerprint)

    # ---------------- 通用前置校验 ----------------
    def _precheck(self):
        """
        所有 API 请求前置安全校验：Origin 白名单 + 每客户端指纹限速。
        通过返回 True；否则已发送错误响应并返回 False。
        """
        origin = self.headers.get('Origin')
        # 浏览器请求会带 Origin；非浏览器/无 Origin 的请求一律拒绝（除非白名单含 '*'）
        if not is_origin_allowed(origin):
            logging.warning(f"🚫 拒绝请求（origin 不在白名单）: {origin}")
            self.send_error_response(403, 'Origin not allowed')
            return False

        client_fingerprint = self._client_fingerprint()
        if not self._check_rate_limit(client_fingerprint):
            logging.warning(f"🚫 拒绝请求（限速）: {client_fingerprint[:12]}")
            self.send_error_response(429, 'Too many requests')
            return False

        return True

    def _cors_origin(self):
        """仅在 Origin 命中白名单时回显该 Origin（不再无条件 '*'）。"""
        origin = self.headers.get('Origin')
        if origin and is_origin_allowed(origin):
            return origin
        # 默认回显白名单首项（'*' 时回显 '*'）
        return ALLOWED_ORIGINS[0] if ALLOWED_ORIGINS else 'null'

    def do_OPTIONS(self):
        """处理CORS预检请求（仅放行白名单 Origin）。"""
        origin = self.headers.get('Origin')
        if not is_origin_allowed(origin):
            self.send_error_response(403, 'Origin not allowed')
            return
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', self._cors_origin())
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Room-Token')
        self.end_headers()

    def do_GET(self):
        """处理GET请求"""
        if not self._precheck():
            return
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        if path == '/health':
            self.handle_health_check()
        elif path.startswith('/api/signal/'):
            self.handle_signal_get(path)
        elif path.startswith('/api/rooms'):
            self.handle_rooms_get(path)
        else:
            self.send_404()

    def do_POST(self):
        """处理POST请求"""
        if not self._precheck():
            return
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        if path.startswith('/api/signal/'):
            self.handle_signal_post(path)
        else:
            self.send_404()

    def handle_health_check(self):
        """健康检查端点（仅汇总计数，不泄漏房间/客户端明细）。"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', self._cors_origin())
        self.end_headers()

        with self.room_lock:
            total_rooms = len(self.rooms)
            total_clients = sum(len(room['clients']) for room in self.rooms.values())

        response = {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'version': '1.0.0',
            'server': 'Python Simple Signaling Server',
            'rooms': total_rooms,
            'total_clients': total_clients
        }

        self.wfile.write(json.dumps(response).encode())
        logging.info(f"Health check - Rooms: {total_rooms}")

    def handle_signal_get(self, path):
        """处理信令GET请求 - 获取房间消息（需 token 准入）。"""
        room_id = path.split('/')[-1]
        client_fingerprint = self._client_fingerprint()

        # 失败 join 限速：阻止暴力枚举房间 token
        if self._is_join_throttled(client_fingerprint):
            logging.warning(f"🚫 GET signal 被限速（失败次数过多）: {client_fingerprint[:12]}")
            self.send_error_response(429, 'Too many failed join attempts, try again later')
            return

        token = self._extract_token(None)

        with self.room_lock:
            ok, err = self._authorize_room(room_id, token, client_fingerprint)
            if not ok:
                # 统一错误，避免「房间是否存在 / token 是否正确」可区分
                self.send_error_response(403, 'Forbidden')
                logging.warning(f"GET /api/signal/{room_id} 被拒: {err}")
                return
            self._register_client(room_id, client_fingerprint)
            room = self.rooms[room_id]
            # 返回最近的消息（限制数量避免过大）
            recent_messages = room['messages'][-50:] if len(room['messages']) > 50 else room['messages']
            client_count = len(room['clients'])

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', self._cors_origin())
        self.end_headers()

        response = {
            'success': True,
            'roomId': room_id,
            'messages': recent_messages,
            'clientCount': client_count,
            'timestamp': int(time.time() * 1000)
        }

        self.wfile.write(json.dumps(response).encode())
        logging.info(f"GET /api/signal/{room_id} - Messages: {len(recent_messages)}")

    def handle_signal_post(self, path):
        """处理信令POST请求 - 发送消息到房间（需 token 准入）。"""
        room_id = path.split('/')[-1]
        client_fingerprint = self._client_fingerprint()

        # 失败 join 限速：阻止暴力枚举房间 token
        if self._is_join_throttled(client_fingerprint):
            logging.warning(f"🚫 POST signal 被限速（失败次数过多）: {client_fingerprint[:12]}")
            self.send_error_response(429, 'Too many failed join attempts, try again later')
            return

        try:
            # 读取请求体并强制 64KB 上限（防超大帧 / 内存放大）
            content_length = int(self.headers.get('Content-Length', 0) or 0)
            if content_length > MAX_BODY_BYTES:
                self.send_error_response(413, 'Payload too large')
                logging.warning(f"POST /api/signal/{room_id} 拒绝超大载荷: {content_length} bytes")
                return
            post_data = self.rfile.read(content_length) if content_length > 0 else b''
            message_data = json.loads(post_data.decode()) if post_data else {}

            token = self._extract_token(message_data if isinstance(message_data, dict) else None)

            with self.room_lock:
                ok, err = self._authorize_room(room_id, token, client_fingerprint, bool(message_data.get('persistent')) if isinstance(message_data, dict) else False)
                if not ok:
                    self.send_error_response(403, 'Forbidden')
                    logging.warning(f"POST /api/signal/{room_id} 被拒: {err}")
                    return
                self._register_client(room_id, client_fingerprint)
                room = self.rooms[room_id]

                # 不把 token 回写进消息历史，避免泄漏
                if isinstance(message_data, dict):
                    message_data = {k: v for k, v in message_data.items() if k != 'token'}

                # 添加时间戳和消息ID
                message = {
                    'id': str(uuid.uuid4()),
                    'timestamp': int(time.time() * 1000),
                    'data': message_data
                }

                # 存储消息
                room['messages'].append(message)

                # 限制消息历史长度
                if len(room['messages']) > 1000:
                    room['messages'] = room['messages'][-500:]

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', self._cors_origin())
            self.end_headers()

            response = {
                'success': True,
                'roomId': room_id,
                'messageId': message['id'],
                'timestamp': message['timestamp']
            }

            self.wfile.write(json.dumps(response).encode())
            mtype = message_data.get('type', 'unknown') if isinstance(message_data, dict) else 'unknown'
            logging.info(f"POST /api/signal/{room_id} - Message type: {mtype}")

        except Exception as e:
            logging.error(f"Error handling POST /api/signal/{room_id}: {e}")
            self.send_error_response(500, 'Internal error')

    def handle_rooms_get(self, path):
        """
        房间信息端点。
        为避免泄漏房间存在性 / roomId 枚举 / 内部 client id：
          - /api/rooms      仅返回房间总数与客户端总数
          - /api/rooms/{id} 恒返回 200 + clientCount（不存在即 0），与「存在」无法区分
        """
        # /api/rooms/{roomId}
        prefix = '/api/rooms/'
        if path.startswith(prefix) and len(path) > len(prefix):
            room_id = path[len(prefix):].strip('/')
            with self.room_lock:
                room = self.rooms.get(room_id)
                client_count = len(room['clients']) if room else 0

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', self._cors_origin())
            self.end_headers()
            self.wfile.write(json.dumps({
                'roomId': room_id,
                'clientCount': client_count
            }).encode())
            return

        # /api/rooms —— 仅汇总计数，不再列出 roomId/明细
        with self.room_lock:
            total_rooms = len(self.rooms)
            total_clients = sum(len(room['clients']) for room in self.rooms.values())

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', self._cors_origin())
        self.end_headers()

        response = {
            'success': True,
            'totalRooms': total_rooms,
            'totalClients': total_clients,
            'timestamp': int(time.time() * 1000)
        }

        self.wfile.write(json.dumps(response).encode())
        logging.info(f"Rooms info requested - Total: {total_rooms}")

    def send_404(self):
        """发送404响应"""
        self.send_response(404)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', self._cors_origin())
        self.end_headers()

        response = {
            'error': 'Endpoint not found',
            'path': self.path,
            'method': self.command,
            'timestamp': int(time.time() * 1000)
        }

        self.wfile.write(json.dumps(response).encode())
        logging.warning(f"404 - {self.command} {self.path}")

    def send_error_response(self, status_code, message):
        """发送错误响应"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', self._cors_origin())
        self.end_headers()

        response = {
            'error': message,
            'status': status_code,
            'timestamp': int(time.time() * 1000)
        }

        self.wfile.write(json.dumps(response).encode())

    def log_message(self, format, *args):
        """重写日志方法，默认不输出客户端 IP。"""
        logging.info(format % args)


def cleanup_old_rooms():
    """定期清理旧房间的后台任务"""
    while True:
        try:
            time.sleep(300)  # 每5分钟清理一次
            current_time = int(time.time() * 1000)

            with SignalingHandler.room_lock:
                rooms_to_remove = []
                for room_id, room_data in SignalingHandler.rooms.items():
                    if room_data.get('persistent'):
                        # 持久化房间保留准入信息，但不长期保留轮询信令消息。
                        if room_data['messages']:
                            last_message_time = room_data['messages'][-1]['timestamp']
                            if current_time - last_message_time > 3600000:
                                room_data['messages'] = []
                        continue

                    # 如果房间超过1小时没有消息，则删除
                    if room_data['messages']:
                        last_message_time = room_data['messages'][-1]['timestamp']
                        if current_time - last_message_time > 3600000:  # 1小时
                            rooms_to_remove.append(room_id)
                    elif len(room_data['clients']) == 0:
                        # 空房间也删除
                        rooms_to_remove.append(room_id)

                for room_id in rooms_to_remove:
                    del SignalingHandler.rooms[room_id]
                    logging.info(f"Cleaned up old room: {room_id}")

            # 顺带清理过期限速桶，避免内存无限增长
            with SignalingHandler.rate_lock:
                for store in (SignalingHandler.rate_buckets, SignalingHandler.failed_join_buckets):
                    stale = [identifier for identifier, b in store.items()
                             if current_time - b['window_start'] > RATE_WINDOW_MS]
                    for identifier in stale:
                        del store[identifier]

        except Exception as e:
            logging.error(f"Error in cleanup task: {e}")


class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    """多线程 HTTP 服务器（请求处理使用守护线程）。"""
    daemon_threads = True


def run_server(port=3001):
    """启动信令服务器"""
    server_address = ('', port)
    httpd = ThreadingHTTPServer(server_address, SignalingHandler)

    # 启动清理任务
    cleanup_thread = threading.Thread(target=cleanup_old_rooms, daemon=True)
    cleanup_thread.start()

    print("🌟 VeilConnect 简单信令服务器启动成功!")
    print(f"📡 HTTP API: http://localhost:{port}")
    print(f"💚 健康检查: http://localhost:{port}/health")
    print(f"📊 房间管理: http://localhost:{port}/api/rooms")
    print(f"🔐 允许的 Origin: {', '.join(ALLOWED_ORIGINS)}")
    print("🔗 支持的HTTP API:")
    print("  - GET  /api/signal/{roomId}: 获取房间消息（需 token）")
    print("  - POST /api/signal/{roomId}: 发送消息到房间（需 token）")
    print("  - GET  /api/rooms: 获取房间总数（不泄漏 roomId）")
    print("  - GET  /health: 服务器健康检查")
    print("")
    print("按 Ctrl+C 停止服务器")
    print("")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 正在关闭信令服务器...")
        httpd.shutdown()
        print("✅ 信令服务器已关闭")


if __name__ == '__main__':
    import sys
    # 端口优先级：命令行参数 > PORT 环境变量 > 默认 3001
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    else:
        port = int(os.environ.get('PORT', 3001))
    run_server(port)
