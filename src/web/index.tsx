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
import { installElectronAPI, isKeyStoreInitialized, unlock } from './bridge/electronAPI';

installElectronAPI();

const MIN_PASSPHRASE_LEN = 8;

const UnlockGate: React.FC = () => {
  const [initialized, setInitialized] = useState<boolean | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
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

  if (unlocked) return <VeilConnectApp />;

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
          type="password"
          autoFocus
          placeholder="口令"
          value={passphrase}
          onChange={e => setPassphrase(e.target.value)}
          disabled={busy || initialized === null}
          style={inputStyle}
        />
        {!initialized && initialized !== null && (
          <input
            type="password"
            placeholder="再次输入口令"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            disabled={busy}
            style={inputStyle}
          />
        )}

        {error && <div style={{ color: '#d32f2f', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <button type="submit" disabled={busy || initialized === null} style={buttonStyle}>
          {busy ? '处理中…' : initialized ? '解锁' : '创建并进入'}
        </button>

        <p style={{ margin: '16px 0 0', color: '#999', fontSize: 12, lineHeight: 1.5 }}>
          口令在本浏览器派生主密钥解密本地身份，绝不上传。忘记口令将无法恢复本设备身份（可用加密导出的身份文件在新设备恢复）。
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
