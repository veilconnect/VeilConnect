import { RatchetManager } from '../src/main/crypto/RatchetManager';

/**
 * Double Ratchet（基于 Signal 协议移植）每条消息级前向保密测试。
 * 握手约定：确定性选出的发起方 establish + 发首条 init 控制密文；对端解密该 prekey 消息以建立入站会话。
 */
describe('RatchetManager Double Ratchet', () => {
  let alice: RatchetManager;
  let bob: RatchetManager;

  beforeEach(() => {
    alice = new RatchetManager();
    bob = new RatchetManager();
  });

  // 模拟一次完整握手：alice 作为发起方
  async function handshake() {
    await alice.getLocalBundle();
    const bobBundle = await bob.getLocalBundle();
    await alice.establish('bob', bobBundle);
    const init = await alice.encrypt('bob', JSON.stringify({ c: 'init' }));
    await bob.decrypt('alice', init.type, init.body); // 建立 bob 的入站会话
    return init;
  }

  it('首条为 prekey 消息(type 3)，对端可解密 init 控制消息', async () => {
    const init = await handshake();
    expect(init.type).toBe(3);
  });

  it('握手后可双向收发', async () => {
    await handshake();
    const m1 = await alice.encrypt('bob', JSON.stringify({ t: 'hi bob' }));
    expect(JSON.parse(await bob.decrypt('alice', m1.type, m1.body))).toEqual({ t: 'hi bob' });
    const m2 = await bob.encrypt('alice', JSON.stringify({ t: 'hi alice' }));
    expect(JSON.parse(await alice.decrypt('bob', m2.type, m2.body))).toEqual({ t: 'hi alice' });
  });

  it('每条消息级前向保密：相同明文产生不同密文', async () => {
    await handshake();
    const c1 = await alice.encrypt('bob', JSON.stringify({ t: 'same' }));
    const c2 = await alice.encrypt('bob', JSON.stringify({ t: 'same' }));
    expect(c1.body).not.toBe(c2.body);
    expect(JSON.parse(await bob.decrypt('alice', c1.type, c1.body))).toEqual({ t: 'same' });
    expect(JSON.parse(await bob.decrypt('alice', c2.type, c2.body))).toEqual({ t: 'same' });
  });

  it('重放已消费的密文会失败（棘轮抗重放）', async () => {
    await handshake();
    const m = await alice.encrypt('bob', JSON.stringify({ t: 'once' }));
    await bob.decrypt('alice', m.type, m.body); // 首次成功
    await expect(bob.decrypt('alice', m.type, m.body)).rejects.toBeDefined();
  });

  it('同实例的 ratchet 身份公钥稳定', async () => {
    const k1 = await alice.getIdentityKey();
    const k2 = await alice.getIdentityKey();
    expect(k1).toBe(k2);
    expect(k1).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it('不同实例的 ratchet 身份公钥不同', async () => {
    expect(await alice.getIdentityKey()).not.toBe(await bob.getIdentityKey());
  });
});
