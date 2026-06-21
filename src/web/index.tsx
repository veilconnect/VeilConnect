/**
 * 网页版入口 —— 替代桌面端的 src/renderer/index.tsx。
 *
 * 流程：先装配 window.electronAPI 桥接 → 渲染「解锁/设置口令」门禁 → 解锁成功后渲染
 * 既有的 VeilConnectApp（其内部通过 window.electronAPI 调用 Worker 内的加密能力，与桌面端一致）。
 */
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import VeilConnectApp from '../renderer/VeilConnectApp';
import '../renderer/VeilConnectApp.css';
import { installElectronAPI, isKeyStoreInitialized, unlock, resetKeyStore } from './bridge/electronAPI';

installElectronAPI();

const MIN_PASSPHRASE_LEN = 12; // 对齐加密导出口令下限（IdentityManager.MIN_EXPORT_PASSWORD_LEN）

// 桌面端（Electron preload 注入了 keystore）由 OS 钥匙串自动解锁，跳过口令门禁。
const isDesktop = typeof window !== 'undefined' && !!(window as any).electronAPI?.keystore;

const UnlockGate: React.FC = () => {
  const [initialized, setInitialized] = useState<boolean | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (isDesktop) return; // 桌面端不走口令门禁，避免无谓启动网页 Worker
    isKeyStoreInitialized()
      .then(setInitialized)
      .catch(() => setInitialized(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (passphrase.length < MIN_PASSPHRASE_LEN) {
      setError(`口令至少 ${MIN_PASSPHRASE_LEN} 个字符`);
      return;
    }
    if (!initialized && passphrase !== confirm) {
      setError('两次输入的口令不一致');
      return;
    }
    setBusy(true);
    try {
      await unlock(passphrase);
      setUnlocked(true);
    } catch (err: any) {
      setError(err?.message || '解锁失败');
    } finally {
      setBusy(false);
    }
  };

  // 忘记口令：清空本地身份后重置为「首次设置」流程（旧身份不可恢复）。
  const resetIdentity = async () => {
    if (!window.confirm('确定重置吗？\n\n本设备上的旧身份将被永久清除、无法恢复（口令无法找回是端到端加密的设计）。\n清除后可用新口令创建一个全新身份继续使用。')) return;
    setBusy(true);
    setError('');
    try {
      await resetKeyStore();
      // 重置后重新初始化页面：回到「首次设置口令」流程
      window.location.reload();
    } catch (err: any) {
      setError(err?.message || '重置失败');
      setBusy(false);
    }
  };

  if (isDesktop || unlocked) return <VeilConnectApp />;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'system-ui, sans-serif'
      }}
    >
      <form
        onSubmit={submit}
        style={{
          background: 'white',
          padding: 32,
          borderRadius: 12,
          width: 360,
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)'
        }}
      >
        <h2 style={{ margin: '0 0 6px', color: '#333' }}>🔒 VeilConnect</h2>
        <p style={{ margin: '0 0 20px', color: '#666', fontSize: 14 }}>
          {initialized === null
            ? '加载中…'
            : initialized
            ? '输入口令解锁本设备上的加密身份'
            : '首次使用：设置一个口令来加密保护你的身份私钥'}
        </p>

        <input
          type={showPw ? 'text' : 'password'}
          autoFocus
          placeholder="口令"
          autoComplete={initialized ? 'current-password' : 'new-password'}
          value={passphrase}
          onChange={e => setPassphrase(e.target.value)}
          disabled={busy || initialized === null}
          style={inputStyle}
        />
        {!initialized && initialized !== null && (
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="再次输入口令"
            autoComplete="new-password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            disabled={busy}
            style={inputStyle}
          />
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#888', margin: '0 0 12px', cursor: 'pointer' }}>
          <input type="checkbox" checked={showPw} onChange={e => setShowPw(e.target.checked)} disabled={busy} />
          显示口令
        </label>

        {error && <div style={{ color: '#d32f2f', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <button type="submit" disabled={busy || initialized === null} style={buttonStyle}>
          {busy ? '处理中…' : initialized ? '解锁' : '创建并进入'}
        </button>

        {initialized === true && (
          <button
            type="button"
            onClick={resetIdentity}
            disabled={busy}
            style={{ width: '100%', marginTop: 10, padding: '8px', background: 'none', color: '#888', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}
          >
            忘记口令？重置并新建身份
          </button>
        )}

        <p style={{ margin: '16px 0 0', color: '#999', fontSize: 12, lineHeight: 1.5 }}>
          口令在本浏览器派生主密钥解密本地身份，绝不上传。忘记口令将无法恢复旧身份；可点上方「重置并新建身份」用新口令重来（或用此前加密导出的身份文件在新设备恢复）。
        </p>
        <p style={{ margin: '12px 0 0', textAlign: 'center', fontSize: 12 }}>
          <a href="/download" style={{ color: '#667eea', textDecoration: 'none' }}>了解 VeilConnect · 下载桌面版 · 自部署 →</a>
        </p>
      </form>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  marginBottom: 12,
  border: '1px solid #ddd',
  borderRadius: 6,
  fontSize: 14
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  fontSize: 15,
  cursor: 'pointer',
  fontWeight: 600
};

function mount() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('找不到 #root 元素');
    return;
  }
  createRoot(rootElement).render(<UnlockGate />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
