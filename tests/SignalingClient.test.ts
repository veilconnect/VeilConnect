import { SignalingClient } from '../src/web/signaling/SignalingClient';

class MockWebSocket {
  static OPEN = 1;

  static instances: MockWebSocket[] = [];

  readyState = MockWebSocket.OPEN;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  sent: string[] = [];

  constructor(public readonly url: string) {
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = 3;
    this.onclose?.();
  }

  receive(message: unknown) {
    this.onmessage?.({ data: JSON.stringify(message) });
  }
}

describe('SignalingClient', () => {
  const originalWebSocket = global.WebSocket;

  beforeEach(() => {
    MockWebSocket.instances = [];
    (global as any).WebSocket = MockWebSocket;
  });

  afterEach(() => {
    global.WebSocket = originalWebSocket;
  });

  it('responds to server heartbeat pings with pong messages', async () => {
    const client = new SignalingClient({}, 'ws://127.0.0.1:3001');
    const connected = client.connect();
    const ws = MockWebSocket.instances[0];

    ws.receive({ type: 'welcome', clientId: 'client-a' });
    await connected;

    ws.receive({ type: 'ping', timestamp: 123 });

    expect(ws.sent).toHaveLength(1);
    expect(JSON.parse(ws.sent[0])).toEqual({
      type: 'pong',
      timestamp: expect.any(Number)
    });
  });
});
