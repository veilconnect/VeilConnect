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
import DownloadView from './blob/DownloadView';
import { parseShareHash } from './blob/blobTransfer';
import { gateStrings, resolveGateLang, isRtlLang } from './gateI18n';
import {
  PublicCommercialConfig,
  applyCommercialBrandingToDocument,
  loadCommercialConfigForHost
} from '../commercial/client';

// 异步文件下载链接(#dl=..&k=..):独立下载页,无需身份/口令/Worker,优先于一切。
const isDownloadLink = typeof location !== 'undefined' && !!parseShareHash(location.hash);

// 非下载页才装配加密桥接(避免下载页无谓启动 Worker)。
if (!isDownloadLink) installElectronAPI();

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
  const [commercialConfig, setCommercialConfig] = useState<PublicCommercialConfig | null>(null);
  // 门禁页在 i18n React 应用挂载前运行，独立解析语言并设置文字方向（RTL）。
  const [lang] = useState(resolveGateLang);
  const g = gateStrings(lang);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = isRtlLang(lang) ? 'rtl' : 'ltr';
    }
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    if (typeof location === 'undefined') return;
    void loadCommercialConfigForHost(location.hostname)
      .then(config => {
        if (cancelled) return;
        setCommercialConfig(config);
        applyCommercialBrandingToDocument(config);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

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
      setError(g.errTooShort.replace('{n}', String(MIN_PASSPHRASE_LEN)));
      return;
    }
    if (!initialized && passphrase !== confirm) {
      setError(g.errMismatch);
      return;
    }
    setBusy(true);
    try {
      await unlock(passphrase);
      setUnlocked(true);
    } catch (err: any) {
      setError(err?.message || g.errUnlock);
    } finally {
      setBusy(false);
    }
  };

  // 忘记口令：清空本地身份后重置为「首次设置」流程（旧身份不可恢复）。
  const resetIdentity = async () => {
    if (!window.confirm(g.resetConfirm)) return;
    setBusy(true);
    setError('');
    try {
      await resetKeyStore();
      // 重置后重新初始化页面：回到「首次设置口令」流程
      window.location.reload();
    } catch (err: any) {
      setError(err?.message || g.errReset);
      setBusy(false);
    }
  };

  if (isDesktop || unlocked) return <VeilConnectApp commercialConfig={commercialConfig} />;

  const productName = commercialConfig?.active ? commercialConfig.branding.productName : 'VeilConnect';
  const primaryColor = commercialConfig?.active ? commercialConfig.branding.primaryColor : '#667eea';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${primaryColor} 0%, #202938 100%)`,
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
        <h2 style={{ margin: '0 0 6px', color: '#333' }}>🔒 {productName}</h2>
        <p style={{ margin: '0 0 20px', color: '#666', fontSize: 14 }}>
          {initialized === null
            ? g.loading
            : initialized
            ? g.promptUnlock
            : g.promptCreate}
        </p>

        <input
          type={showPw ? 'text' : 'password'}
          autoFocus
          placeholder={g.passphrasePlaceholder}
          autoComplete={initialized ? 'current-password' : 'new-password'}
          value={passphrase}
          onChange={e => setPassphrase(e.target.value)}
          disabled={busy || initialized === null}
          style={inputStyle}
        />
        {!initialized && initialized !== null && (
          <input
            type={showPw ? 'text' : 'password'}
            placeholder={g.confirmPlaceholder}
            autoComplete="new-password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            disabled={busy}
            style={inputStyle}
          />
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#888', margin: '0 0 12px', cursor: 'pointer' }}>
          <input type="checkbox" checked={showPw} onChange={e => setShowPw(e.target.checked)} disabled={busy} />
          {g.showPassphrase}
        </label>

        {error && <div style={{ color: '#d32f2f', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <button type="submit" disabled={busy || initialized === null} style={{ ...buttonStyle, background: `linear-gradient(135deg, ${primaryColor}, #202938)` }}>
          {busy ? g.processing : initialized ? g.unlockBtn : g.createBtn}
        </button>

        {initialized === true && (
          <button
            type="button"
            onClick={resetIdentity}
            disabled={busy}
            style={{ width: '100%', marginTop: 10, padding: '8px', background: 'none', color: '#888', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}
          >
            {g.forgotBtn}
          </button>
        )}

        <p style={{ margin: '16px 0 0', color: '#999', fontSize: 12, lineHeight: 1.5 }}>
          {g.privacyNote}
        </p>
        <p style={{ margin: '12px 0 0', textAlign: 'center', fontSize: 12 }}>
          <a href="/download" style={{ color: primaryColor, textDecoration: 'none' }}>{g.learnMore}</a>
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
  createRoot(rootElement).render(isDownloadLink ? <DownloadView /> : <UnlockGate />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}

// PWA Service Worker：仅网页(http/https)注册——让应用外壳被缓存，域名被封后仍能离线启动。
// 桌面端(file://)与下载页跳过；注册失败静默(不影响主流程)。
if (
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  typeof location !== 'undefined' &&
  location.protocol.startsWith('http') &&
  !isDownloadLink
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* 忽略：SW 不可用不影响使用 */ });
  });
}
