/**
 * 异步文件下载视图(网盘式)——独立页面,**无需身份/口令**:打开 `#dl=<id>&k=<密钥>` 链接即可
 * (设了提取密码则需输入密码)→ 流式下载密文 → 逐块本地解密 → 保存。密钥来自链接 #片段,不经服务器。
 * 大文件:支持 File System Access API 时【边解边写盘】(不占内存);否则回退内存 Blob 保存。
 * 由 index.tsx 在检测到 #dl= 时优先渲染(早于口令门禁)。
 */
import React, { useState } from 'react';
import { parseShareHash, receiveFile, BlobMeta } from './blobTransfer';

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export const DownloadView: React.FC = () => {
  const parsed = parseShareHash(location.hash);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');
  const [meta, setMeta] = useState<BlobMeta | null>(null);
  const [url, setUrl] = useState('');
  const [pct, setPct] = useState(0);

  const start = async () => {
    if (!parsed) return;
    const password0 = parsed.needsPassword ? password : undefined;
    const onProgress = (r: number, t: number) => setPct(t > 0 ? Math.floor((r / t) * 100) : 0);

    // 大文件优先：在用户手势内打开"保存到磁盘",边解边写,不占内存。
    const fsApi = typeof (window as any).showSaveFilePicker === 'function';
    if (fsApi) {
      let handle: any;
      try { handle = await (window as any).showSaveFilePicker(); }
      catch { return; } // 用户取消保存对话框
      setStatus('working'); setError(''); setPct(0);
      let writable: any;
      try {
        writable = await handle.createWritable();
        const { meta } = await receiveFile(parsed.id, parsed.rawKey, {
          password: password0, onProgress, sink: (b) => writable.write(b)
        });
        await writable.close();
        setMeta(meta); setStatus('saved');
      } catch (e) {
        try { if (writable) await writable.abort(); } catch { /* ignore */ }
        setStatus('error');
        setError(parsed.needsPassword ? '下载或解密失败:密码错误,或文件已过期/损坏。' : '下载或解密失败:文件可能已过期、被删除或链接损坏。');
      }
      return;
    }

    // 回退：内存 Blob(适合中小文件;无 File System Access API 的浏览器)
    setStatus('working'); setError(''); setPct(0);
    try {
      const { meta, blob } = await receiveFile(parsed.id, parsed.rawKey, { password: password0, onProgress });
      const objUrl = URL.createObjectURL(blob!);
      setMeta(meta); setUrl(objUrl); setStatus('done');
      const a = document.createElement('a');
      a.href = objUrl; a.download = meta.name || 'download'; document.body.appendChild(a); a.click(); a.remove();
    } catch {
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

  const working = status === 'working';
  const finished = status === 'done' || status === 'saved';

  return (
    <div style={box}>
      <div style={card}>
        <h2 style={{ margin: '0 0 6px', color: '#333' }}>📦 收到一个加密文件</h2>
        <p style={{ margin: '0 0 16px', color: '#666', fontSize: 13, lineHeight: 1.6 }}>
          通过 VeilConnect 链接分享。文件在你本机解密,服务器只存密文、无密钥解不开。
        </p>

        {finished && meta ? (
          <div>
            <div style={{ padding: 12, background: '#eef9f1', border: '1px solid #cde9d6', borderRadius: 8, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, wordBreak: 'break-all' }}>{meta.name}</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                {fmtBytes(meta.size)} · 已解密 · 校验通过 ✅{status === 'saved' ? ' · 已保存到磁盘' : ''}
              </div>
            </div>
            {status === 'done' && url && (
              <a href={url} download={meta.name} style={{ ...btn, display: 'block', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>⬇ 重新下载</a>
            )}
          </div>
        ) : (
          <div>
            {parsed.needsPassword && (
              <input style={input} type="password" placeholder="提取密码" value={password} autoFocus
                onChange={e => setPassword(e.target.value)} onKeyPress={e => { if (e.key === 'Enter') void start(); }}
                disabled={working} />
            )}
            {error && <div style={{ color: '#d32f2f', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            {working && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.max(2, pct)}%`, background: 'linear-gradient(135deg,#667eea,#764ba2)', transition: 'width .2s' }} />
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 6, textAlign: 'center' }}>下载并解密中… {pct}%</div>
              </div>
            )}
            <button style={{ ...btn, opacity: working ? 0.6 : 1 }} onClick={() => void start()} disabled={working}>
              {working ? '处理中…' : (parsed.needsPassword ? '输入密码并下载' : '⬇ 下载并解密')}
            </button>
          </div>
        )}
        <p style={{ margin: '16px 0 0', color: '#999', fontSize: 12 }}>下载链接含解密密钥,请勿转发给不该看到此文件的人。</p>
      </div>
    </div>
  );
};

export default DownloadView;
