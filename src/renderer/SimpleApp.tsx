import React, { useState, useEffect } from 'react';
import { useTranslation } from './i18n/useTranslation';

// 用户身份接口
interface UserIdentity {
  publicKey: string;
  privateKey: string;
  nickname: string;
  avatar: string;
  publicId: string;
  createdAt: number;
  sessionId: string;
}

interface SimpleAppProps {
  onReady?: (identity: UserIdentity) => void;
}

const SimpleApp: React.FC<SimpleAppProps> = ({ onReady }) => {
  const { t, currentLanguage, changeLanguage, supportedLanguages } = useTranslation();
  const [userIdentity, setUserIdentity] = useState<UserIdentity | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');

  // 初始化应用
  useEffect(() => {
    initializeApp();
  }, []);

  // 身份就绪时通知父组件
  useEffect(() => {
    if (userIdentity && onReady) {
      onReady(userIdentity);
    }
  }, [userIdentity, onReady]);

  // 初始化应用
  const initializeApp = async () => {
    try {
      // 检查ElectronAPI是否可用
      if (!(window as any).electronAPI) {
        console.error('❌ ElectronAPI不可用');
        setError('ElectronAPI不可用，请确保应用在Electron环境中运行');
        return;
      }

      console.log('✅ ElectronAPI可用');
      
      // 从electron存储加载身份
      const savedIdentity = await (window as any).electronAPI.identity.getCurrentIdentity();
      
      if (savedIdentity) {
        const identity = toUserIdentity(savedIdentity);
        setUserIdentity(identity);
        console.log('✅ 加载已保存的身份:', identity.publicId);
      } else {
        console.log('📝 未找到保存的身份，需要生成新身份');
      }
    } catch (error) {
      console.error('❌ 初始化应用失败:', error);
      setError('应用初始化失败: ' + (error as Error).message);
    }
  };

  // Base58编码函数
  const base58Encode = (buffer: Uint8Array): string => {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    let num = 0n;
    
    for (let i = 0; i < buffer.length; i++) {
      num = num * 256n + BigInt(buffer[i]);
    }
    
    while (num > 0n) {
      const remainder = num % 58n;
      result = alphabet[Number(remainder)] + result;
      num = num / 58n;
    }
    
    for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
      result = '1' + result;
    }
    
    return result || '1';
  };

  // 生成会话ID
  const generateSessionId = (): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 10);
    const platform = 'desktop';
    return `${timestamp}_${random}_${platform}`;
  };

  // 将主进程/worker 返回的身份（使用 userId）映射为渲染端兼容结构（使用 publicId）。
  // 私钥始终保留在主进程，渲染端不持有；sessionId 为渲染端本地生成。
  const toUserIdentity = (saved: any): UserIdentity => ({
    publicKey: saved.publicKey,
    privateKey: '', // 私钥保留在主进程，渲染端不持有
    nickname: saved.nickname,
    avatar: saved.avatar || '👤',
    publicId: saved.userId ?? saved.publicId,
    createdAt: saved.createdAt,
    sessionId: generateSessionId()
  });

  // 生成身份
  const generateIdentity = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      console.log('🔐 生成新身份...');
      
      // 生成密钥对
      const keyPair = await (window as any).electronAPI.crypto.generateKeyPair();
      
      if (!keyPair) {
        throw new Error('密钥对生成失败');
      }
      
      // 生成公钥哈希作为唯一ID
      const publicKeyBuffer = new TextEncoder().encode(keyPair.publicKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', publicKeyBuffer);
      const hashArray = new Uint8Array(hashBuffer);
      
      // 转换为Base58编码
      const publicId = base58Encode(hashArray.slice(0, 16));
      
      // 生成唯一昵称
      const timestamp = Date.now().toString(36);
      const randomSuffix = Math.random().toString(36).substr(2, 6);
      const nickname = `User_${timestamp}_${randomSuffix}`;
      
      const identity: UserIdentity = {
        publicKey: keyPair.publicKey,
        privateKey: '', // 私钥保留在主进程，渲染端不持有

        nickname: nickname,
        avatar: '👤',
        publicId: publicId,
        createdAt: Date.now(),
        sessionId: generateSessionId()
      };
      
      // 保存到electron存储
      const savedIdentity = await (window as any).electronAPI.identity.createNewIdentity(identity.nickname);
      
      // 使用Electron返回的身份信息（包含正确的密钥格式）
      if (savedIdentity) {
        // 通过统一映射把 Electron 返回的身份（userId）转换为渲染端结构（publicId）
        const mergedIdentity = toUserIdentity(savedIdentity);
                 setUserIdentity(mergedIdentity);
         console.log('✅ 身份生成并保存完成, ID:', mergedIdentity.publicId);
       } else {
         // 如果保存失败，仍然使用我们生成的身份
         setUserIdentity(identity);
         console.log('✅ 身份生成完成(未保存), ID:', identity.publicId);
       }
      
    } catch (error) {
      console.error('❌ 生成身份失败:', error);
      setError('身份生成失败: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 清除身份
  const clearIdentity = () => {
    setUserIdentity(null);
    setError('');
    console.log('🗑️ 身份已清除');
  };

  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f7fa',
      minHeight: '100vh',
      margin: 0,
      padding: 0
    },
    header: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '1rem 2rem',
      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
    },
    title: {
      margin: 0,
      fontSize: '1.5rem',
      fontWeight: 600
    },
    main: {
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto'
    },
    errorAlert: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '1rem',
      border: '1px solid #f5c6cb'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '2rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      textAlign: 'center' as const
    },
    button: {
      padding: '12px 24px',
      fontSize: '1.1rem',
      fontWeight: 600,
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      transition: 'all 0.2s ease'
    },
    buttonSecondary: {
      padding: '8px 16px',
      fontSize: '1rem',
      borderRadius: '6px',
      border: '2px solid #667eea',
      backgroundColor: 'transparent',
      color: '#667eea',
      cursor: 'pointer'
    },
    featureBox: {
      backgroundColor: '#f8f9fa',
      padding: '1.5rem',
      borderRadius: '8px',
      marginTop: '2rem',
      textAlign: 'left' as const
    }
  };

  return (
    <div style={styles.container}>
      <header style={{ ...styles.header, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={styles.title}>🛡️ {t.appTitle} — {t.appSubtitle}</h1>
        <select
          value={currentLanguage}
          onChange={(e) => changeLanguage(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.15)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 13
          }}
        >
          {supportedLanguages.map(lang => (
            <option key={lang.code} value={lang.code} style={{ color: '#000' }}>
              {lang.nativeName}
            </option>
          ))}
        </select>
      </header>

      <main style={styles.main}>
        {error && (
          <div style={styles.errorAlert}>
            {error}
          </div>
        )}

        {!userIdentity ? (
          <div style={styles.card}>
            <h2 style={{ color: '#667eea', marginBottom: '1rem' }}>
              🛡️ {t.welcome.title}
            </h2>

            <h3 style={{ color: '#666', marginBottom: '2rem' }}>
              {t.welcome.subtitle}
            </h3>

            {isGenerating ? (
              <div style={{ marginBottom: '2rem' }}>
                <div>⏳ {t.common.loading}</div>
              </div>
            ) : (
              <p style={{ marginBottom: '2rem' }}>
                {t.identity.status.pleaseGenerate}
              </p>
            )}

            <button
              style={styles.button}
              onClick={generateIdentity}
              disabled={isGenerating}
            >
              {isGenerating ? t.common.loading : `🔑 ${t.identity.generateButton}`}
            </button>

            <div style={styles.featureBox}>
              <h4 style={{ color: '#667eea', marginBottom: '1rem' }}>
                {t.welcome.features.title}
              </h4>
              <div>
                <p>{t.welcome.features.encryption}</p>
                <p>{t.welcome.features.p2p}</p>
                <p>{t.welcome.features.customId}</p>
                <p>{t.welcome.features.fileTransfer}</p>
                <p>{t.welcome.features.decentralized}</p>
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.card}>
            <h2 style={{ color: '#667eea' }}>{t.completion.title}</h2>
            <div style={{ margin: '2rem 0', textAlign: 'left' }}>
              <p><strong>{t.identity.userId}</strong> {userIdentity.publicId}</p>
              <p><strong>{t.identity.nickname}</strong> {userIdentity.nickname}</p>
              <p>{userIdentity.avatar}</p>
              <p>{new Date(userIdentity.createdAt).toLocaleString()}</p>
            </div>
            <button
              style={styles.buttonSecondary}
              onClick={clearIdentity}
            >
              {t.identity.clearButton}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default SimpleApp; 