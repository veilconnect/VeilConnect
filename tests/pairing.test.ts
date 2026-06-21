import {
  generatePairingCode,
  groupPairingCode,
  normalizePairingCode,
  buildTranscript,
  preparePairing,
  verifyPeerReveal,
  computeProof,
  commitProof,
  constantTimeEqual,
  derivePairingKey,
  PartyKeys,
  PAIRING_CODE_BYTES
} from '../src/web/security/pairing';

// Node 20+ 暴露全局 crypto.subtle，本模块可直接在测试环境跑。
describe('pairing code (auto anti-MITM)', () => {
  // 三组互不相同的「身份/box/棘轮」公钥（base64，内容任意但唯一）。
  const ALICE: PartyKeys = { identityKey: 'QWxpY2VJZA==', boxKey: 'QWxpY2VCb3g=', ratchetKey: 'QWxpY2VSY2g=' };
  const BOB: PartyKeys = { identityKey: 'Qm9iSWQ=', boxKey: 'Qm9iQm94', ratchetKey: 'Qm9iUmNo' };
  // 中间人对两端各自冒充用的两套密钥（攻击者自己的身份，无法是 Alice/Bob 的）。
  const MITM_TO_ALICE: PartyKeys = { identityKey: 'TWl0bUEx', boxKey: 'TWl0bUJveEE=', ratchetKey: 'TWl0bVJjaEE=' };
  const MITM_TO_BOB: PartyKeys = { identityKey: 'TWl0bUIx', boxKey: 'TWl0bUJveEI=', ratchetKey: 'TWl0bVJjaEI=' };

  const CODE = 'ABCD1234EFGH5678JKMN90PQ';

  describe('code generation & normalization', () => {
    it('生成码为去歧义 Base32，长度对应 128bit（26 字符），且只含字母表字符', () => {
      const code = generatePairingCode();
      expect(code).toHaveLength(Math.ceil((PAIRING_CODE_BYTES * 8) / 5)); // 26
      expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]+$/); // 无 I L O U
    });

    it('两次生成几乎不可能相同（高熵）', () => {
      expect(generatePairingCode()).not.toBe(generatePairingCode());
    });

    it('归一化：大小写/分隔符/易混字符规整且幂等', () => {
      const once = normalizePairingCode('abcd-1234 efgh');
      expect(once).toBe('ABCD1234EFGH');
      expect(normalizePairingCode(once)).toBe(once); // 幂等
      // I/L→1, O→0, U→V
      expect(normalizePairingCode('ILOU')).toBe('110V');
    });

    it('分组显示每 4 字符一个连字符', () => {
      expect(groupPairingCode('ABCD1234EFGH')).toBe('ABCD-1234-EFGH');
    });
  });

  describe('transcript binding', () => {
    it('与顺序无关：buildTranscript(a,b) 与 (b,a) 得到同一 transcript，角色互换', () => {
      const ab = buildTranscript(ALICE, BOB);
      const ba = buildTranscript(BOB, ALICE);
      expect(ab.transcript).toBe(ba.transcript);
      expect(ab.selfRole).toBe(ba.peerRole);
      expect(ab.peerRole).toBe(ba.selfRole);
    });

    it('改动任一公钥即改变 transcript（雪崩）', () => {
      const base = buildTranscript(ALICE, BOB).transcript;
      const changed = buildTranscript({ ...ALICE, ratchetKey: 'W++=' }, BOB).transcript;
      expect(changed).not.toBe(base);
    });
  });

  describe('happy path（双方同码、无中间人）', () => {
    it('双方各自算出的 proof 能被对端验证通过', async () => {
      // Alice 视角：self=ALICE, peer=BOB
      const a = await preparePairing(CODE, ALICE, BOB);
      // Bob 视角：self=BOB, peer=ALICE
      const b = await preparePairing(CODE, BOB, ALICE);

      // transcript 一致
      expect(a.transcript).toBe(b.transcript);
      // 角色相反
      expect(a.selfRole).not.toBe(b.selfRole);
      // 一端的「期望对端 proof」应等于另一端实际算出的 myProof
      expect(a.expectedPeerProof).toBe(b.myProof);
      expect(b.expectedPeerProof).toBe(a.myProof);

      // 走完整 reveal 校验：Alice 验 Bob 的 reveal，Bob 验 Alice 的
      await expect(verifyPeerReveal(a, b.myCommit, b.myProof)).resolves.toBe(true);
      await expect(verifyPeerReveal(b, a.myCommit, a.myProof)).resolves.toBe(true);
    });
  });

  describe('MITM 检测（两端被各自冒充 → 自动失败）', () => {
    it('两端 transcript 不同 → proof 互不匹配 → 校验失败', async () => {
      // Alice 以为在和「对端」说话，实际看到的是 MITM_TO_ALICE 的公钥
      const a = await preparePairing(CODE, ALICE, MITM_TO_ALICE);
      // Bob 看到的是 MITM_TO_BOB 的公钥
      const b = await preparePairing(CODE, BOB, MITM_TO_BOB);

      expect(a.transcript).not.toBe(b.transcript);

      // 中间人即便知道码也无法让两端互相通过（它必须转发某一端的 proof，
      // 但那对应错误的 transcript/角色）。模拟中间人把 Bob 的 reveal 转给 Alice：
      await expect(verifyPeerReveal(a, b.myCommit, b.myProof)).resolves.toBe(false);
      await expect(verifyPeerReveal(b, a.myCommit, a.myProof)).resolves.toBe(false);
    });
  });

  describe('错误配对码 → 失败', () => {
    it('一端用错码 → 校验失败', async () => {
      const a = await preparePairing(CODE, ALICE, BOB);
      const bWrong = await preparePairing('ZZZZ9999ZZZZ9999ZZZZ9999', BOB, ALICE);
      await expect(verifyPeerReveal(a, bWrong.myCommit, bWrong.myProof)).resolves.toBe(false);
    });
  });

  describe('commit 绑定', () => {
    it('篡改 proof 但保留旧 commit → commit 校验失败', async () => {
      const a = await preparePairing(CODE, ALICE, BOB);
      const b = await preparePairing(CODE, BOB, ALICE);
      const tampered = b.myProof.slice(0, -2) + (b.myProof.endsWith('A=') ? 'B=' : 'A=');
      // 用真实 commit 配伪造 proof
      await expect(verifyPeerReveal(a, b.myCommit, tampered)).resolves.toBe(false);
    });

    it('commitProof 与 computeProof 确定性', async () => {
      const key = await derivePairingKey(CODE);
      const { transcript } = buildTranscript(ALICE, BOB);
      const p1 = await computeProof(key, transcript, 'A');
      const p2 = await computeProof(key, transcript, 'A');
      expect(p1).toBe(p2);
      expect(await computeProof(key, transcript, 'B')).not.toBe(p1); // 角色绑定
      expect(await commitProof(p1)).toBe(await commitProof(p1));
    });
  });

  describe('constantTimeEqual', () => {
    it('相等/不等/不同长度', () => {
      expect(constantTimeEqual('abc', 'abc')).toBe(true);
      expect(constantTimeEqual('abc', 'abd')).toBe(false);
      expect(constantTimeEqual('abc', 'ab')).toBe(false);
      expect(constantTimeEqual('', '')).toBe(true);
    });
  });
});
