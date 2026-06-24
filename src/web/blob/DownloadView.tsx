/**
 * 异步文件下载视图(网盘式)——独立页面,**无需身份/口令**:打开 `#dl=<id>&k=<密钥>` 链接即可
 * (设了提取密码则需输入密码)→ 下载密文 → 本地解密 → 保存。密钥来自链接 #片段,不经服务器。
 * 由 index.tsx 在检测到 #dl= 时优先渲染(早于口令门禁)。
 */
import React, { useState } from 'react';
import { parseShareHash, receiveFile, BlobMeta } from './blobTransfer';

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export const DownloadView: React.FC = () => {
  const parsed = parseShareHash(location.hash);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [meta, setMeta] = useState<BlobMeta | null>(null);
  const [url, setUrl] = useState('');

  const start = async () => {
    if (!parsed) return;
    setStatus('working'); setError('');
    try {
      const { meta, blob } = await receiveFile(parsed.id, parsed.rawKey, { password: parsed.needsPassword ? password : undefined });
      const objUrl = URL.createObjectURL(blob);
      setMeta(meta); setUrl(objUrl); setStatus('done');
      // 自动触发保存
      const a = document.createElement('a');
      a.href = objUrl; a.download = meta.name || 'download'; document.body.appendChild(a); a.click(); a.remove();
    } catch (e: any) {
      setStatus('error');
      setError(parsed.needsPassword ? '下载或解密失败:密码错误,或文件已过期/损坏。' : '下载或解密失败:文件可能已过期、被删除或链接损坏。');
    }
  };

  const box: React.CSSProperties = {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', fontFamily: 'system-ui, sans-serif'
  };
  const card: React.CSSProperties = { background: 'white', padding: 32, borderRadius: 12, width: 380, boxShadow: '0 12px 40px rgba(0,0,0,0.25)' };
  const btn: React.CSSProperties = { width: '100%', padding: 11, background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', border: 'none', borderRadius: 6, fontSize: 15, cursor: 'pointer', fontWeight: 600 };
  const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', marginBottom: 12, border: '1px solid #ddd', borderRadius: 6, fontSize: 14 };

  if (!parsed) {
    return <div style={box}><div style={card}><h2 style={{ margin: 0 }}>🔒 VeilConnect</h2><p style={{ color: '#666' }}>链接无效或缺少密钥。</p></div></div>;
  }

  return (
    <div style={box}>
      <div style={card}>
        <h2 style={{ margin: '0 0 6px', color: '#333' }}>📦 收到一个加密文件</h2>
        <p style={{ margin: '0 0 16px', color: '#666', fontSize: 13, lineHeight: 1.6 }}>
          通过 VeilConnect 链接分享。文件在你本机解密,服务器只存密文、无密钥解不开。
        </p>

        {status === 'done' && meta ? (
          <div>
            <div style={{ padding: 12, background: '#eef9f1', border: '1px solid #cde9d6', borderRadius: 8, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, wordBreak: 'break-all' }}>{meta.name}</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{fmtBytes(meta.size)} · 已解密 · 校验通过 ✅</div>
            </div>
            <a href={url} download={meta.name} style={{ ...btn, display: 'block', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>⬇ 重新下载</a>
          </div>
        ) : (
          <div>
            {parsed.needsPassword && (
              <input style={input} type="password" placeholder="提取密码" value={password} autoFocus
                onChange={e => setPassword(e.target.value)} onKeyPress={e => { if (e.key === 'Enter') void start(); }}
                disabled={status === 'working'} />
            )}
            {error && <div style={{ color: '#d32f2f', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <button style={{ ...btn, opacity: status === 'working' ? 0.6 : 1 }} onClick={() => void start()} disabled={status === 'working'}>
              {status === 'working' ? '下载并解密中…' : (parsed.needsPassword ? '输入密码并下载' : '⬇ 下载并解密')}
            </button>
          </div>
        )}
        <p style={{ margin: '16px 0 0', color: '#999', fontSize: 12 }}>下载链接含解密密钥,请勿转发给不该看到此文件的人。</p>
      </div>
    </div>
  );
};

export default DownloadView;
