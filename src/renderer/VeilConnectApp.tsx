import React, { useCallback, useEffect, useState } from 'react';
import SimpleApp from './SimpleApp';
import { SimpleP2PChat } from './components/SimpleP2PChat';
import { I18nProvider } from './i18n/I18nProvider';

interface Identity {
  publicKey: string;
  privateKey: string;
  nickname: string;
  avatar: string;
  publicId: string;
  createdAt: number;
  sessionId: string;
}

const VeilConnectApp: React.FC = () => {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [view, setView] = useState<'identity' | 'chat'>('identity');

  useEffect(() => {
    (async () => {
      const api = (window as any).electronAPI;
      if (!api) return;
      try {
        const stored = await api.identity.getCurrentIdentity();
        if (stored && stored.userId) {
          setIdentity(mapStored(stored));
          setView('chat');
        }
      } catch (err) {
        console.error('[VeilConnect] failed to load identity', err);
      }
    })();
  }, []);

  const handleReady = useCallback((freshIdentity: Identity) => {
    setIdentity(freshIdentity);
    setView('chat');
  }, []);

  const handleSwitchIdentity = useCallback(() => {
    setView('identity');
  }, []);

  return (
    <I18nProvider>
      <div className="veilconnect-root">
        {view === 'chat' && identity ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <TopBar identity={identity} onSwitch={handleSwitchIdentity} />
            <div style={{ flex: 1, minHeight: 0, background: '#f5f7fa' }}>
              <SimpleP2PChat
                userIdentity={{
                  customId: identity.publicId,
                  nickname: identity.nickname,
                  publicKey: identity.publicKey,
                  privateKey: identity.privateKey
                }}
                onClose={handleSwitchIdentity}
              />
            </div>
          </div>
        ) : (
          <SimpleApp onReady={handleReady} />
        )}
      </div>
    </I18nProvider>
  );
};

const TopBar: React.FC<{ identity: Identity; onSwitch: () => void }> = ({ identity, onSwitch }) => (
  <div
    style={{
      padding: '10px 20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 22 }}>{identity.avatar || '👤'}</span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 600 }}>{identity.nickname}</span>
        <span style={{ fontSize: 11, opacity: 0.85, fontFamily: 'monospace' }}>
          {identity.publicId.slice(0, 16)}…
        </span>
      </div>
    </div>
    <button
      onClick={onSwitch}
      style={{
        background: 'rgba(255,255,255,0.15)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.4)',
        borderRadius: 6,
        padding: '6px 14px',
        cursor: 'pointer',
        fontSize: 13
      }}
    >
      身份管理
    </button>
  </div>
);

function mapStored(stored: any): Identity {
  return {
    publicKey: stored.publicKey,
    privateKey: stored.secretKey ?? stored.privateKey ?? '',
    nickname: stored.nickname,
    avatar: stored.avatar ?? '👤',
    publicId: stored.userId ?? stored.publicId,
    createdAt: stored.createdAt,
    sessionId: stored.sessionId ?? `${stored.createdAt}_loaded`
  };
}

export default VeilConnectApp;
