export interface Translations {
  // 应用标题和描述
  appTitle: string;
  appSubtitle: string;
  appDescription: string;
  
  // 欢迎界面
  welcome: {
    title: string;
    subtitle: string;
    description: string;
    features: {
      title: string;
      encryption: string;
      p2p: string;
      customId: string;
      fileTransfer: string;
      decentralized: string;
    };
    startButton: string;
  };
  
  // 身份设置
  identity: {
    title: string;
    generateButton: string;
    clearButton: string;
    status: {
      active: string;
      inactive: string;
      pleaseGenerate: string;
    };
    userId: string;
    nickname: string;
    publicKey: string;
    privateKey: string;
  };
  
  // 加密功能
  encryption: {
    title: string;
    inputPlaceholder: string;
    testButton: string;
    original: string;
    encrypted: string;
    decrypted: string;
    success: string;
    error: string;
    pleaseGenerateIdentity: string;
    pleaseEnterText: string;
  };
  
  // 系统状态
  system: {
    title: string;
    identityStatus: string;
    messageCount: string;
    contactCount: string;
    uptime: string;
    seconds: string;
  };
  
  // 功能演示
  features: {
    title: string;
    encryptionDemo: {
      title: string;
      description: string;
      button: string;
    };
    identityDemo: {
      title: string;
      description: string;
      button: string;
    };
    storageDemo: {
      title: string;
      description: string;
      button: string;
    };
    p2pDemo: {
      title: string;
      description: string;
      button: string;
    };
  };
  
  // 日志系统
  log: {
    title: string;
    clearButton: string;
    cleared: string;
  };
  
  // 设置
  settings: {
    title: string;
    language: string;
    theme: string;
    notifications: string;
  };
  
  // 通用
  common: {
    save: string;
    cancel: string;
    confirm: string;
    delete: string;
    edit: string;
    close: string;
    back: string;
    next: string;
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
  };
  
  // 成功完成界面
  completion: {
    title: string;
    description: string;
    idType: string;
    restartButton: string;
    chatButton: string;
    chatComingSoon: string;
  };

  // 聊天功能
  chat: {
    needIdentity: string;
    generateFirst: string;
    notConnected: string;
    connecting: string;
    connected: string;
    disconnected: string;
    encrypted: string;
    offline: string;
    createConnection: string;
    joinConnection: string;
    disconnect: string;
    connect: string;
    typePlaceholder: string;
    connectToSend: string;
    shareConnection: string;
    shareInstructions: string;
    joinInstructions: string;
    connectionIdPlaceholder: string;
    waitingConnection: string;
    connectionFailed: string;
    joinFailed: string;
    sendFailed: string;
    idCopied: string;
    send: string;
  };
}

export const translations: Record<string, Translations> = {
  'zh-CN': {
    appTitle: 'VeilConnect',
    appSubtitle: 'P2P加密聊天软件',
    appDescription: '基于P2P技术的端到端加密聊天应用，不依赖中心服务器，确保您的通信隐私和安全。',
    
    welcome: {
      title: 'VeilConnect',
      subtitle: 'P2P加密聊天软件',
      description: '欢迎使用VeilConnect！这是一个基于P2P技术的端到端加密聊天应用，不依赖中心服务器，确保您的通信隐私和安全。',
      features: {
        title: '🔐 核心特性',
        encryption: '• 端到端加密 (XSalsa20-Poly1305)',
        p2p: '• P2P直连通信 (WebRTC)',
        customId: '• 自定义用户ID',
        fileTransfer: '• 文件传输支持',
        decentralized: '• 完全去中心化'
      },
      startButton: '开始使用'
    },
    
    identity: {
      title: '🔑 身份管理',
      generateButton: '生成新身份',
      clearButton: '清除身份',
      status: {
        active: '✅ 身份已激活',
        inactive: 'ℹ️ 请先生成身份',
        pleaseGenerate: '请先生成身份'
      },
      userId: '用户ID:',
      nickname: '昵称:',
      publicKey: '公钥:',
      privateKey: '私钥:'
    },
    
    encryption: {
      title: '🔐 加密测试',
      inputPlaceholder: '输入要加密的文本',
      testButton: '测试加密',
      original: '原文:',
      encrypted: '密文:',
      decrypted: '解密:',
      success: '✅ 加密测试成功',
      error: '加密测试失败',
      pleaseGenerateIdentity: '请先生成身份',
      pleaseEnterText: '请输入要加密的文本'
    },
    
    system: {
      title: '📊 系统状态',
      identityStatus: '身份状态:',
      messageCount: '消息数量:',
      contactCount: '联系人数量:',
      uptime: '运行时间:',
      seconds: '秒'
    },
    
    features: {
      title: '🚀 核心功能演示',
      encryptionDemo: {
        title: '🔐 端到端加密',
        description: '使用XSalsa20-Poly1305算法确保消息安全',
        button: '演示加密'
      },
      identityDemo: {
        title: '🆔 用户身份',
        description: '基于Ed25519公钥的唯一身份标识',
        button: '演示身份'
      },
      storageDemo: {
        title: '💾 本地存储',
        description: '消息和联系人的本地加密存储',
        button: '演示存储'
      },
      p2pDemo: {
        title: '🌐 P2P连接',
        description: 'WebRTC直连通信（需要两个客户端）',
        button: '演示P2P'
      }
    },
    
    log: {
      title: '📝 系统日志',
      clearButton: '清除日志',
      cleared: '日志已清除'
    },
    
    settings: {
      title: '⚙️ 设置',
      language: '语言',
      theme: '主题',
      notifications: '通知'
    },
    
    common: {
      save: '保存',
      cancel: '取消',
      confirm: '确认',
      delete: '删除',
      edit: '编辑',
      close: '关闭',
      back: '返回',
      next: '下一步',
      loading: '加载中...',
      error: '错误',
      success: '成功',
      warning: '警告',
      info: '信息'
    },
    
    completion: {
      title: '身份创建成功！',
      description: '🎉 恭喜！您已成功创建VeilConnect身份。现在您可以与其他用户建立安全的P2P连接了。',
      idType: 'ID类型:',
      restartButton: '重新设置',
      chatButton: '开始聊天',
      chatComingSoon: '聊天功能正在开发中...'
    },

    chat: {
      needIdentity: '需要身份信息',
      generateFirst: '请先生成身份信息以开始聊天',
      notConnected: '未连接',
      connecting: '连接中',
      connected: 'P2P连接已建立',
      disconnected: 'P2P连接已断开',
      encrypted: '加密通信',
      offline: '离线',
      createConnection: '创建连接',
      joinConnection: '加入连接',
      disconnect: '断开连接',
      connect: '连接',
      typePlaceholder: '输入消息...',
      connectToSend: '连接到对方以发送消息',
      shareConnection: '分享连接',
      shareInstructions: '将此连接ID分享给您的朋友：',
      joinInstructions: '输入您朋友的连接ID：',
      connectionIdPlaceholder: '在此粘贴连接ID',
      waitingConnection: '等待对方连接',
      connectionFailed: '创建连接失败',
      joinFailed: '加入连接失败',
      sendFailed: '发送消息失败',
      idCopied: '连接ID已复制到剪贴板',
      send: '发送'
    }
  },
  
  'en': {
    appTitle: 'VeilConnect',
    appSubtitle: 'P2P Encrypted Chat',
    appDescription: 'A P2P end-to-end encrypted chat application that ensures your communication privacy and security without relying on central servers.',
    
    welcome: {
      title: 'VeilConnect',
      subtitle: 'P2P Encrypted Chat',
      description: 'Welcome to VeilConnect! This is a P2P end-to-end encrypted chat application that ensures your communication privacy and security without relying on central servers.',
      features: {
        title: '🔐 Core Features',
        encryption: '• End-to-end encryption (XSalsa20-Poly1305)',
        p2p: '• P2P direct communication (WebRTC)',
        customId: '• Custom user ID',
        fileTransfer: '• File transfer support',
        decentralized: '• Fully decentralized'
      },
      startButton: 'Get Started'
    },
    
    identity: {
      title: '🔑 Identity Management',
      generateButton: 'Generate New Identity',
      clearButton: 'Clear Identity',
      status: {
        active: '✅ Identity Active',
        inactive: 'ℹ️ Please generate identity first',
        pleaseGenerate: 'Please generate identity first'
      },
      userId: 'User ID:',
      nickname: 'Nickname:',
      publicKey: 'Public Key:',
      privateKey: 'Private Key:'
    },
    
    encryption: {
      title: '🔐 Encryption Test',
      inputPlaceholder: 'Enter text to encrypt',
      testButton: 'Test Encryption',
      original: 'Original:',
      encrypted: 'Encrypted:',
      decrypted: 'Decrypted:',
      success: '✅ Encryption test successful',
      error: 'Encryption test failed',
      pleaseGenerateIdentity: 'Please generate identity first',
      pleaseEnterText: 'Please enter text to encrypt'
    },
    
    system: {
      title: '📊 System Status',
      identityStatus: 'Identity Status:',
      messageCount: 'Message Count:',
      contactCount: 'Contact Count:',
      uptime: 'Uptime:',
      seconds: 'seconds'
    },
    
    features: {
      title: '🚀 Core Feature Demo',
      encryptionDemo: {
        title: '🔐 End-to-End Encryption',
        description: 'Secure messages with XSalsa20-Poly1305 algorithm',
        button: 'Demo Encryption'
      },
      identityDemo: {
        title: '🆔 User Identity',
        description: 'Unique identity based on Ed25519 public key',
        button: 'Demo Identity'
      },
      storageDemo: {
        title: '💾 Local Storage',
        description: 'Local encrypted storage for messages and contacts',
        button: 'Demo Storage'
      },
      p2pDemo: {
        title: '🌐 P2P Connection',
        description: 'WebRTC direct communication (requires two clients)',
        button: 'Demo P2P'
      }
    },
    
    log: {
      title: '📝 System Log',
      clearButton: 'Clear Log',
      cleared: 'Log cleared'
    },
    
    settings: {
      title: '⚙️ Settings',
      language: 'Language',
      theme: 'Theme',
      notifications: 'Notifications'
    },
    
    common: {
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Info'
    },
    
    completion: {
      title: 'Identity Created Successfully!',
      description: '🎉 Congratulations! You have successfully created your VeilConnect identity. You can now establish secure P2P connections with other users.',
      idType: 'ID Type:',
      restartButton: 'Reset',
      chatButton: 'Start Chat',
      chatComingSoon: 'Chat feature is under development...'
    },

    chat: {
      needIdentity: 'Identity Required',
      generateFirst: 'Please generate an identity first to start chatting',
      notConnected: 'Not Connected',
      connecting: 'Connecting',
      connected: 'P2P connection established',
      disconnected: 'P2P connection lost',
      encrypted: 'Encrypted Communication',
      offline: 'Offline',
      createConnection: 'Create',
      joinConnection: 'Join',
      disconnect: 'Disconnect',
      connect: 'Connect',
      typePlaceholder: 'Type a message...',
      connectToSend: 'Connect to a peer to send messages',
      shareConnection: 'Share Connection',
      shareInstructions: 'Share this connection ID with your friend:',
      joinInstructions: 'Enter the connection ID from your friend:',
      connectionIdPlaceholder: 'Paste connection ID here',
      waitingConnection: 'Waiting for peer to connect',
      connectionFailed: 'Failed to create connection',
      joinFailed: 'Failed to join connection',
      sendFailed: 'Failed to send message',
      idCopied: 'Connection ID copied to clipboard',
      send: 'Send'
    }
  },
  
  'ja': {
    appTitle: 'VeilConnect',
    appSubtitle: 'P2P暗号化チャット',
    appDescription: '中央サーバーに依存せず、通信のプライバシーとセキュリティを確保するP2Pエンドツーエンド暗号化チャットアプリケーション。',
    
    welcome: {
      title: 'VeilConnect',
      subtitle: 'P2P暗号化チャット',
      description: 'VeilConnectへようこそ！これは中央サーバーに依存せず、通信のプライバシーとセキュリティを確保するP2Pエンドツーエンド暗号化チャットアプリケーションです。',
      features: {
        title: '🔐 主要機能',
        encryption: '• エンドツーエンド暗号化 (XSalsa20-Poly1305)',
        p2p: '• P2P直接通信 (WebRTC)',
        customId: '• カスタムユーザーID',
        fileTransfer: '• ファイル転送サポート',
        decentralized: '• 完全分散型'
      },
      startButton: '開始'
    },
    
    identity: {
      title: '🔑 アイデンティティ管理',
      generateButton: '新しいアイデンティティを生成',
      clearButton: 'アイデンティティをクリア',
      status: {
        active: '✅ アイデンティティがアクティブ',
        inactive: 'ℹ️ 最初にアイデンティティを生成してください',
        pleaseGenerate: '最初にアイデンティティを生成してください'
      },
      userId: 'ユーザーID:',
      nickname: 'ニックネーム:',
      publicKey: '公開鍵:',
      privateKey: '秘密鍵:'
    },
    
    encryption: {
      title: '🔐 暗号化テスト',
      inputPlaceholder: '暗号化するテキストを入力',
      testButton: '暗号化テスト',
      original: '元のテキスト:',
      encrypted: '暗号化:',
      decrypted: '復号化:',
      success: '✅ 暗号化テスト成功',
      error: '暗号化テスト失敗',
      pleaseGenerateIdentity: '最初にアイデンティティを生成してください',
      pleaseEnterText: '暗号化するテキストを入力してください'
    },
    
    system: {
      title: '📊 システム状態',
      identityStatus: 'アイデンティティ状態:',
      messageCount: 'メッセージ数:',
      contactCount: '連絡先数:',
      uptime: '稼働時間:',
      seconds: '秒'
    },
    
    features: {
      title: '🚀 主要機能デモ',
      encryptionDemo: {
        title: '🔐 エンドツーエンド暗号化',
        description: 'XSalsa20-Poly1305アルゴリズムでメッセージを保護',
        button: '暗号化デモ'
      },
      identityDemo: {
        title: '🆔 ユーザーアイデンティティ',
        description: 'Ed25519公開鍵に基づく一意のアイデンティティ',
        button: 'アイデンティティデモ'
      },
      storageDemo: {
        title: '💾 ローカルストレージ',
        description: 'メッセージと連絡先のローカル暗号化ストレージ',
        button: 'ストレージデモ'
      },
      p2pDemo: {
        title: '🌐 P2P接続',
        description: 'WebRTC直接通信（2つのクライアントが必要）',
        button: 'P2Pデモ'
      }
    },
    
    log: {
      title: '📝 システムログ',
      clearButton: 'ログをクリア',
      cleared: 'ログがクリアされました'
    },
    
    settings: {
      title: '⚙️ 設定',
      language: '言語',
      theme: 'テーマ',
      notifications: '通知'
    },
    
    common: {
      save: '保存',
      cancel: 'キャンセル',
      confirm: '確認',
      delete: '削除',
      edit: '編集',
      close: '閉じる',
      back: '戻る',
      next: '次へ',
      loading: '読み込み中...',
      error: 'エラー',
      success: '成功',
      warning: '警告',
      info: '情報'
    },
    
    completion: {
      title: 'アイデンティティ作成成功！',
      description: '🎉 おめでとうございます！VeilConnectアイデンティティの作成に成功しました。他のユーザーと安全なP2P接続を確立できるようになりました。',
      idType: 'IDタイプ:',
      restartButton: 'リセット',
      chatButton: 'チャット開始',
      chatComingSoon: 'チャット機能は開発中です...'
    },

    chat: {
      needIdentity: 'アイデンティティが必要',
      generateFirst: 'チャットを開始するには、まずアイデンティティを生成してください',
      notConnected: '未接続',
      connecting: '接続中',
      connected: 'P2P接続が確立されました',
      disconnected: 'P2P接続が切断されました',
      encrypted: '暗号化通信',
      offline: 'オフライン',
      createConnection: '作成',
      joinConnection: '参加',
      disconnect: '切断',
      connect: '接続',
      typePlaceholder: 'メッセージを入力...',
      connectToSend: 'メッセージを送信するにはピアに接続してください',
      shareConnection: '接続を共有',
      shareInstructions: 'この接続IDを友達と共有してください：',
      joinInstructions: '友達からの接続IDを入力してください：',
      connectionIdPlaceholder: '接続IDをここに貼り付けてください',
      waitingConnection: 'ピアの接続を待機中',
      connectionFailed: '接続の作成に失敗しました',
      joinFailed: '接続への参加に失敗しました',
      sendFailed: 'メッセージの送信に失敗しました',
      idCopied: '接続IDがクリップボードにコピーされました',
      send: '送信'
    }
  },
  
  'es': {
    appTitle: 'VeilConnect',
    appSubtitle: 'Chat P2P Encriptado',
    appDescription: 'Una aplicación de chat P2P con cifrado de extremo a extremo que garantiza la privacidad y seguridad de tu comunicación sin depender de servidores centrales.',
    
    welcome: {
      title: 'VeilConnect',
      subtitle: 'Chat P2P Encriptado',
      description: '¡Bienvenido a VeilConnect! Esta es una aplicación de chat P2P con cifrado de extremo a extremo que garantiza la privacidad y seguridad de tu comunicación sin depender de servidores centrales.',
      features: {
        title: '🔐 Características Principales',
        encryption: '• Cifrado de extremo a extremo (XSalsa20-Poly1305)',
        p2p: '• Comunicación directa P2P (WebRTC)',
        customId: '• ID de usuario personalizado',
        fileTransfer: '• Soporte para transferencia de archivos',
        decentralized: '• Completamente descentralizado'
      },
      startButton: 'Comenzar'
    },
    
    identity: {
      title: '🔑 Gestión de Identidad',
      generateButton: 'Generar Nueva Identidad',
      clearButton: 'Limpiar Identidad',
      status: {
        active: '✅ Identidad Activa',
        inactive: 'ℹ️ Por favor genera una identidad primero',
        pleaseGenerate: 'Por favor genera una identidad primero'
      },
      userId: 'ID de Usuario:',
      nickname: 'Apodo:',
      publicKey: 'Clave Pública:',
      privateKey: 'Clave Privada:'
    },
    
    encryption: {
      title: '🔐 Prueba de Cifrado',
      inputPlaceholder: 'Ingresa texto para cifrar',
      testButton: 'Probar Cifrado',
      original: 'Original:',
      encrypted: 'Cifrado:',
      decrypted: 'Descifrado:',
      success: '✅ Prueba de cifrado exitosa',
      error: 'Prueba de cifrado fallida',
      pleaseGenerateIdentity: 'Por favor genera una identidad primero',
      pleaseEnterText: 'Por favor ingresa texto para cifrar'
    },
    
    system: {
      title: '📊 Estado del Sistema',
      identityStatus: 'Estado de Identidad:',
      messageCount: 'Cantidad de Mensajes:',
      contactCount: 'Cantidad de Contactos:',
      uptime: 'Tiempo Activo:',
      seconds: 'segundos'
    },
    
    features: {
      title: '🚀 Demo de Características Principales',
      encryptionDemo: {
        title: '🔐 Cifrado de Extremo a Extremo',
        description: 'Mensajes seguros con algoritmo XSalsa20-Poly1305',
        button: 'Demo de Cifrado'
      },
      identityDemo: {
        title: '🆔 Identidad de Usuario',
        description: 'Identidad única basada en clave pública Ed25519',
        button: 'Demo de Identidad'
      },
      storageDemo: {
        title: '💾 Almacenamiento Local',
        description: 'Almacenamiento local cifrado para mensajes y contactos',
        button: 'Demo de Almacenamiento'
      },
      p2pDemo: {
        title: '🌐 Conexión P2P',
        description: 'Comunicación directa WebRTC (requiere dos clientes)',
        button: 'Demo P2P'
      }
    },
    
    log: {
      title: '📝 Registro del Sistema',
      clearButton: 'Limpiar Registro',
      cleared: 'Registro limpiado'
    },
    
    settings: {
      title: '⚙️ Configuración',
      language: 'Idioma',
      theme: 'Tema',
      notifications: 'Notificaciones'
    },
    
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      delete: 'Eliminar',
      edit: 'Editar',
      close: 'Cerrar',
      back: 'Atrás',
      next: 'Siguiente',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      warning: 'Advertencia',
      info: 'Información'
    },
    
    completion: {
      title: '¡Identidad Creada Exitosamente!',
      description: '🎉 ¡Felicitaciones! Has creado exitosamente tu identidad VeilConnect. Ahora puedes establecer conexiones P2P seguras con otros usuarios.',
      idType: 'Tipo de ID:',
      restartButton: 'Reiniciar',
      chatButton: 'Iniciar Chat',
      chatComingSoon: 'La función de chat está en desarrollo...'
    },

    chat: {
      needIdentity: 'Identidad Requerida',
      generateFirst: 'Por favor genera una identidad primero para comenzar a chatear',
      notConnected: 'No Conectado',
      connecting: 'Conectando',
      connected: 'Conexión P2P establecida',
      disconnected: 'Conexión P2P perdida',
      encrypted: 'Comunicación Encriptada',
      offline: 'Sin Conexión',
      createConnection: 'Crear',
      joinConnection: 'Unirse',
      disconnect: 'Desconectar',
      connect: 'Conectar',
      typePlaceholder: 'Escribe un mensaje...',
      connectToSend: 'Conéctate a un par para enviar mensajes',
      shareConnection: 'Compartir Conexión',
      shareInstructions: 'Comparte este ID de conexión con tu amigo:',
      joinInstructions: 'Ingresa el ID de conexión de tu amigo:',
      connectionIdPlaceholder: 'Pega el ID de conexión aquí',
      waitingConnection: 'Esperando que el par se conecte',
      connectionFailed: 'Error al crear la conexión',
      joinFailed: 'Error al unirse a la conexión',
      sendFailed: 'Error al enviar el mensaje',
      idCopied: 'ID de conexión copiado al portapapeles',
      send: 'Enviar'
    }
  }
};
