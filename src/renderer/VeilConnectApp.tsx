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

  useEffect(() => {
    (async () => {
      const api = (window as any).electronAPI;
      if (!api) return;
      try {
        const stored = await api.identity.getCurrentIdentity();
        if (stored && stored.userId) {
          setIdentity(mapStored(stored));
        }
      } catch (err) {
        console.error('[VeilConnect] failed to load identity', err);
      }
    })();
  }, []);

  const handleReady = useCallback((freshIdentity: any) => {
    // 规整字段：加载路径可能传入原始存储对象（userId/secretKey），统一映射为 publicId/privateKey。
    setIdentity(mapStored(freshIdentity));
  }, []);

  return (
    <I18nProvider>
      <div className="veilconnect-root">
        {identity ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f5f7fa' }}>
            <SimpleP2PChat
              userIdentity={{
                customId: identity.publicId,
                nickname: identity.nickname,
                publicKey: identity.publicKey,
                privateKey: identity.privateKey
              }}
            />
          </div>
        ) : (
          <SimpleApp onReady={handleReady} />
        )}
      </div>
    </I18nProvider>
  );
};

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
