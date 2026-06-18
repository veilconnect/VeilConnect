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
    // —— P2P 聊天界面（SimpleP2PChat）补齐文案 ——
    p2p: {
      headerTitle: string;
      editNicknameTitle: string;
      mePrefix: string;
      unnamed: string;
      badgeVerifiedTitle: string;
      badgeVerified: string;
      badgeEncryptedTitle: string;
      badgePendingSas: string;
      badgeHandshaking: string;
      badgeFailed: string;
      aboutTitle: string;
      aboutToggle: string;
      sasDialogTitle: string;
      sasDialogBodyLine1: string;
      sasDialogBodyLine2: string;
      peerPrefix: string;
      sasAgree: string;
      sasDisagree: string;
      sasBarLabel: string;
      sasVerifiedMark: string;
      createRoomTitle: string;
      createRoomBtn: string;
      oneToOneNote: string;
      joinRoomBtn: string;
      roomCreatedHeading: string;
      establishingEncrypted: string;
      waitingPeerJoin: string;
      roomLinkWarning: string;
      copyLink: string;
      collapse: string;
      aboutPrivacyTitle: string;
      aboutPrivacyBody: string;
      clearDataTitle: string;
      clearDataBtn: string;
      emptyConnected: string;
      emptyDisconnected: string;
      placeholderWaitingSecure: string;
      placeholderConfirmSas: string;
      joinRoomDialogTitle: string;
      pasteRoomLink: string;
      cancel: string;
      join: string;
      loadIdentityFailed: string;
      identityIncomplete: string;
      secureChannelFailed: string;
      e2eEstablished: string;
      e2eEstablishing: string;
      peerVerifyFailed: string;
      relayNotice: string;
      connectedEstablishing: string;
      connectFailed: string;
      peerDisconnected: string;
      peerJoinedConnecting: string;
      negotiationFailed: string;
      negotiationError: string;
      peerLeft: string;
      signalingError: string;
      roomReadyWaiting: string;
      joinedConnecting: string;
      serverConnectFailed: string;
      notSecureYet: string;
      verifySasFirst: string;
      disconnectedManual: string;
      copiedToClipboard: string;
      relayNotReady: string;
      sasMismatch: string;
      nicknameUpdated: string;
      nicknameUpdateFailed: string;
      sasConfirmedToast: string;
      setNicknamePrompt: string;
      clearDataConfirm: string;
    };
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
      send: '发送',
      p2p: {
        headerTitle: '💬 P2P 安全聊天',
        editNicknameTitle: '点击修改昵称（对方会看到）',
        mePrefix: '我：',
        unnamed: '未命名',
        badgeVerifiedTitle: '消息已端到端加密，且你已带外核对安全码、确认无中间人',
        badgeVerified: '🔒 已加密 · 已验证',
        badgeEncryptedTitle: '消息已端到端加密，但尚未带外核对安全码，无法排除中间人',
        badgePendingSas: '🔒 已加密 · 待核对安全码',
        badgeHandshaking: '🔄 安全握手中…',
        badgeFailed: '⛔ 验证失败',
        aboutTitle: '关于 / 隐私与本地数据',
        aboutToggle: 'ⓘ 关于',
        sasDialogTitle: '🛡️ 核对安全码',
        sasDialogBodyLine1: '和对方互相报一遍下面这串数字（电话/当面等可信渠道）。',
        sasDialogBodyLine2: '一致才说明没有中间人——这是最关键的一步。',
        peerPrefix: '对方：',
        sasAgree: '✓ 一致，开始聊天',
        sasDisagree: '✗ 不一致，断开',
        sasBarLabel: '🛡️ 安全码',
        sasVerifiedMark: '✓ 已核对一致',
        createRoomTitle: '创建一个严格一对一房间：满 2 人后，再有人拿到链接也会被服务器拒绝（Room full）。',
        createRoomBtn: '🔗 创建房间',
        oneToOneNote: '· 一对一（满 2 人后自动锁房）',
        joinRoomBtn: '🔌 加入房间',
        roomCreatedHeading: '🔗 房间已创建 —— 把链接发给对方，对方在浏览器打开即自动加入',
        establishingEncrypted: '🔄 正在建立加密连接…',
        waitingPeerJoin: '● 等待对方加入…',
        roomLinkWarning: '⚠️ 链接含一次性房间口令，请通过可信渠道发送。连接建立后，请与对方通过电话/当面核对下方「安全码」一致，再开始聊天——这是排除中间人（含信令服务器作恶）的关键一步。',
        copyLink: '📋 复制链接',
        collapse: '收起',
        aboutPrivacyTitle: '消息端到端加密、点对点直传；服务器仅做配对中转，不经手也不存储任何消息',
        aboutPrivacyBody: '🔒 服务器不保存任何聊天记录；消息端到端加密、点对点直传。聊天记录仅存于本设备浏览器（关闭页面即清，不上传）。',
        clearDataTitle: '删除本浏览器保存的身份与全部本地数据，回到初始状态',
        clearDataBtn: '清除本地数据',
        emptyConnected: '加密通道已建立，发条消息开始聊天吧。',
        emptyDisconnected: '点「🔗 创建房间」生成链接发给对方，\n或打开对方发来的链接，即可开始端到端加密聊天。',
        placeholderWaitingSecure: '等待安全通道建立…',
        placeholderConfirmSas: '请先核对安全码并点「一致，确认」…',
        joinRoomDialogTitle: '🔌 加入房间',
        pasteRoomLink: '粘贴对方发来的房间链接：',
        cancel: '取消',
        join: '加入',
        loadIdentityFailed: '读取本地身份失败，请刷新页面重试。',
        identityIncomplete: '本地身份不完整，无法建立加密通道，请重置身份后重试。',
        secureChannelFailed: '建立加密通道失败，请重试。',
        e2eEstablished: '🔐 端到端加密通道已建立。请与对方核对下方安全码一致后再开始聊天。',
        e2eEstablishing: '🔐 正在建立端到端加密通道…',
        peerVerifyFailed: '⛔ 对方身份验证失败，可能存在中间人攻击，已断开连接。',
        relayNotice: '🔒 将通过中继服务器加密直连对方，你的真实 IP 不会暴露给对方。',
        connectedEstablishing: '✅ 已连上对方，正在建立端到端加密…',
        connectFailed: '建立连接失败，请重试。',
        peerDisconnected: '与对方的连接已断开。',
        peerJoinedConnecting: '对方已加入，正在连接…',
        negotiationFailed: '连接协商失败，请重试。',
        negotiationError: '连接协商出错，请重试。',
        peerLeft: '对方已离开，本次会话已结束。',
        signalingError: '连接服务异常，请稍后重试。',
        roomReadyWaiting: '房间已就绪，等待对方加入…',
        joinedConnecting: '已进入房间，正在连接对方…',
        serverConnectFailed: '无法连接到服务器，请检查网络后重试。',
        notSecureYet: '安全通道尚未建立，无法发送消息',
        verifySasFirst: '请先与对方通过电话/当面核对安全码并确认一致，再发送消息',
        disconnectedManual: '已断开连接',
        copiedToClipboard: '已复制到剪贴板',
        relayNotReady: '中继服务器未就绪，可能无法连接。如长时间连不上，请联系站点管理员。',
        sasMismatch: '安全码不一致，疑似中间人，已断开',
        nicknameUpdated: '昵称已更新',
        nicknameUpdateFailed: '昵称更新失败',
        sasConfirmedToast: '已确认安全码一致，可以开始聊天',
        setNicknamePrompt: '设置你的昵称（对方会看到）：',
        clearDataConfirm: '清除本设备的全部本地数据？\n\n将删除本浏览器内保存的加密身份与所有本地数据，且不可恢复（服务器本就不存任何数据）。清除后回到「设置口令」从头开始。'
      }
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
      send: 'Send',
      p2p: {
        headerTitle: '💬 P2P Secure Chat',
        editNicknameTitle: 'Click to change your nickname (visible to your peer)',
        mePrefix: 'Me: ',
        unnamed: 'Unnamed',
        badgeVerifiedTitle: 'Messages are end-to-end encrypted, and you have verified the safety code out-of-band — no man-in-the-middle',
        badgeVerified: '🔒 Encrypted · Verified',
        badgeEncryptedTitle: 'Messages are end-to-end encrypted, but the safety code has not been verified out-of-band, so a man-in-the-middle cannot be ruled out',
        badgePendingSas: '🔒 Encrypted · Verify safety code',
        badgeHandshaking: '🔄 Securing connection…',
        badgeFailed: '⛔ Verification failed',
        aboutTitle: 'About / Privacy & local data',
        aboutToggle: 'ⓘ About',
        sasDialogTitle: '🛡️ Verify safety code',
        sasDialogBodyLine1: 'Read the digits below to each other over a trusted channel (phone / in person).',
        sasDialogBodyLine2: 'Only if they match is there no man-in-the-middle — this is the most important step.',
        peerPrefix: 'Peer: ',
        sasAgree: '✓ They match, start chatting',
        sasDisagree: '✗ They differ, disconnect',
        sasBarLabel: '🛡️ Safety code',
        sasVerifiedMark: '✓ Verified match',
        createRoomTitle: 'Create a strict one-to-one room: once 2 people join, anyone else with the link is rejected by the server (Room full).',
        createRoomBtn: '🔗 Create room',
        oneToOneNote: '· One-to-one (locks after 2 join)',
        joinRoomBtn: '🔌 Join room',
        roomCreatedHeading: '🔗 Room created — send the link to your peer; it auto-joins when they open it in a browser',
        establishingEncrypted: '🔄 Establishing encrypted connection…',
        waitingPeerJoin: '● Waiting for peer to join…',
        roomLinkWarning: '⚠️ The link contains a one-time room token; send it over a trusted channel. After connecting, verify the “safety code” below with your peer by phone / in person before chatting — this is the key step to rule out a man-in-the-middle (including a malicious signaling server).',
        copyLink: '📋 Copy link',
        collapse: 'Collapse',
        aboutPrivacyTitle: 'Messages are end-to-end encrypted and sent peer-to-peer; the server only relays pairing and never handles or stores any message',
        aboutPrivacyBody: '🔒 The server stores no chat history; messages are end-to-end encrypted and sent peer-to-peer. Chat history lives only in this device’s browser (cleared when the page closes, never uploaded).',
        clearDataTitle: 'Delete the identity and all local data saved in this browser, returning to the initial state',
        clearDataBtn: 'Clear local data',
        emptyConnected: 'Encrypted channel established — send a message to start chatting.',
        emptyDisconnected: 'Click “🔗 Create room” to generate a link for your peer,\nor open a link they sent you, to start an end-to-end encrypted chat.',
        placeholderWaitingSecure: 'Waiting for the secure channel…',
        placeholderConfirmSas: 'First verify the safety code and click “They match”…',
        joinRoomDialogTitle: '🔌 Join room',
        pasteRoomLink: 'Paste the room link your peer sent you:',
        cancel: 'Cancel',
        join: 'Join',
        loadIdentityFailed: 'Failed to read local identity. Please refresh the page and try again.',
        identityIncomplete: 'Local identity is incomplete; cannot establish an encrypted channel. Please reset your identity and try again.',
        secureChannelFailed: 'Failed to establish the encrypted channel. Please try again.',
        e2eEstablished: '🔐 End-to-end encrypted channel established. Verify the safety code below with your peer before chatting.',
        e2eEstablishing: '🔐 Establishing end-to-end encrypted channel…',
        peerVerifyFailed: '⛔ Peer identity verification failed — a man-in-the-middle may be present. Disconnected.',
        relayNotice: '🔒 You will connect to your peer encrypted via a relay server; your real IP is not exposed to them.',
        connectedEstablishing: '✅ Connected to peer, establishing end-to-end encryption…',
        connectFailed: 'Failed to connect. Please try again.',
        peerDisconnected: 'The connection to your peer has been closed.',
        peerJoinedConnecting: 'Peer joined, connecting…',
        negotiationFailed: 'Connection negotiation failed. Please try again.',
        negotiationError: 'Connection negotiation error. Please try again.',
        peerLeft: 'Your peer left; this session has ended.',
        signalingError: 'The connection service had an error. Please try again later.',
        roomReadyWaiting: 'Room ready, waiting for peer to join…',
        joinedConnecting: 'Joined the room, connecting to peer…',
        serverConnectFailed: 'Cannot connect to the server. Check your network and try again.',
        notSecureYet: 'The secure channel is not ready; cannot send messages',
        verifySasFirst: 'First verify the safety code with your peer by phone / in person and confirm it matches, then send messages',
        disconnectedManual: 'Disconnected',
        copiedToClipboard: 'Copied to clipboard',
        relayNotReady: 'The relay server is not ready and the connection may fail. If it stays unreachable, contact the site administrator.',
        sasMismatch: 'Safety code mismatch — possible man-in-the-middle. Disconnected.',
        nicknameUpdated: 'Nickname updated',
        nicknameUpdateFailed: 'Failed to update nickname',
        sasConfirmedToast: 'Safety code confirmed as matching — you can start chatting',
        setNicknamePrompt: 'Set your nickname (visible to your peer):',
        clearDataConfirm: 'Clear all local data on this device?\n\nThis deletes the encrypted identity and all local data saved in this browser, and cannot be undone (the server stores nothing anyway). Afterwards you return to “Set passphrase” and start over.'
      }
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
      send: '送信',
      p2p: {
        headerTitle: '💬 P2P セキュアチャット',
        editNicknameTitle: 'クリックしてニックネームを変更（相手に表示されます）',
        mePrefix: '自分：',
        unnamed: '名称未設定',
        badgeVerifiedTitle: 'メッセージはエンドツーエンドで暗号化され、安全コードを帯域外で照合済み — 中間者はいません',
        badgeVerified: '🔒 暗号化済み · 検証済み',
        badgeEncryptedTitle: 'メッセージはエンドツーエンドで暗号化されていますが、安全コードを帯域外で照合していないため中間者を排除できません',
        badgePendingSas: '🔒 暗号化済み · 安全コード未照合',
        badgeHandshaking: '🔄 セキュア接続中…',
        badgeFailed: '⛔ 検証失敗',
        aboutTitle: '概要 / プライバシーとローカルデータ',
        aboutToggle: 'ⓘ 概要',
        sasDialogTitle: '🛡️ 安全コードの照合',
        sasDialogBodyLine1: '下の数字を信頼できる経路（電話・対面など）で互いに読み上げてください。',
        sasDialogBodyLine2: '一致して初めて中間者がいないと分かります — これが最も重要な手順です。',
        peerPrefix: '相手：',
        sasAgree: '✓ 一致、チャットを開始',
        sasDisagree: '✗ 不一致、切断',
        sasBarLabel: '🛡️ 安全コード',
        sasVerifiedMark: '✓ 照合一致',
        createRoomTitle: '厳密な1対1ルームを作成：2人が参加した後はリンクを持つ他の人もサーバーに拒否されます（Room full）。',
        createRoomBtn: '🔗 ルーム作成',
        oneToOneNote: '· 1対1（2人参加で自動ロック）',
        joinRoomBtn: '🔌 ルームに参加',
        roomCreatedHeading: '🔗 ルームを作成しました —— リンクを相手に送ってください。相手がブラウザで開くと自動的に参加します',
        establishingEncrypted: '🔄 暗号化接続を確立中…',
        waitingPeerJoin: '● 相手の参加を待機中…',
        roomLinkWarning: '⚠️ リンクには使い捨てのルームトークンが含まれます。信頼できる経路で送ってください。接続後、下の「安全コード」を電話・対面で相手と照合し、一致を確認してからチャットを始めてください —— これは中間者（信号サーバーの不正を含む）を排除する重要な手順です。',
        copyLink: '📋 リンクをコピー',
        collapse: '折りたたむ',
        aboutPrivacyTitle: 'メッセージはエンドツーエンドで暗号化されピアツーピアで直接送信されます。サーバーはペアリングの中継のみで、メッセージを扱わず保存もしません',
        aboutPrivacyBody: '🔒 サーバーはチャット履歴を一切保存しません。メッセージはエンドツーエンドで暗号化されピアツーピアで直接送信されます。チャット履歴はこの端末のブラウザにのみ保存されます（ページを閉じると消去、アップロードされません）。',
        clearDataTitle: 'このブラウザに保存された身元とすべてのローカルデータを削除し、初期状態に戻します',
        clearDataBtn: 'ローカルデータを消去',
        emptyConnected: '暗号化チャネルを確立しました — メッセージを送ってチャットを始めましょう。',
        emptyDisconnected: '「🔗 ルーム作成」を押してリンクを相手に送るか、\n相手から届いたリンクを開くと、エンドツーエンド暗号化チャットを始められます。',
        placeholderWaitingSecure: 'セキュアチャネルを待機中…',
        placeholderConfirmSas: 'まず安全コードを照合し「一致」を押してください…',
        joinRoomDialogTitle: '🔌 ルームに参加',
        pasteRoomLink: '相手から届いたルームリンクを貼り付けてください：',
        cancel: 'キャンセル',
        join: '参加',
        loadIdentityFailed: 'ローカル身元の読み込みに失敗しました。ページを更新して再試行してください。',
        identityIncomplete: 'ローカル身元が不完全で暗号化チャネルを確立できません。身元をリセットして再試行してください。',
        secureChannelFailed: '暗号化チャネルの確立に失敗しました。再試行してください。',
        e2eEstablished: '🔐 エンドツーエンド暗号化チャネルを確立しました。下の安全コードを相手と照合してからチャットを始めてください。',
        e2eEstablishing: '🔐 エンドツーエンド暗号化チャネルを確立中…',
        peerVerifyFailed: '⛔ 相手の身元検証に失敗しました。中間者攻撃の可能性があります。切断しました。',
        relayNotice: '🔒 中継サーバー経由で暗号化して相手に接続します。あなたの実IPは相手に公開されません。',
        connectedEstablishing: '✅ 相手に接続しました。エンドツーエンド暗号化を確立中…',
        connectFailed: '接続の確立に失敗しました。再試行してください。',
        peerDisconnected: '相手との接続が切断されました。',
        peerJoinedConnecting: '相手が参加しました。接続中…',
        negotiationFailed: '接続交渉に失敗しました。再試行してください。',
        negotiationError: '接続交渉でエラーが発生しました。再試行してください。',
        peerLeft: '相手が退出しました。このセッションは終了しました。',
        signalingError: '接続サービスでエラーが発生しました。しばらくして再試行してください。',
        roomReadyWaiting: 'ルームの準備ができました。相手の参加を待機中…',
        joinedConnecting: 'ルームに参加しました。相手に接続中…',
        serverConnectFailed: 'サーバーに接続できません。ネットワークを確認して再試行してください。',
        notSecureYet: 'セキュアチャネルが未確立のためメッセージを送信できません',
        verifySasFirst: 'まず電話・対面で相手と安全コードを照合し一致を確認してからメッセージを送信してください',
        disconnectedManual: '切断しました',
        copiedToClipboard: 'クリップボードにコピーしました',
        relayNotReady: '中継サーバーの準備ができておらず接続できない可能性があります。長時間つながらない場合はサイト管理者にお問い合わせください。',
        sasMismatch: '安全コードが一致しません。中間者の疑いがあるため切断しました。',
        nicknameUpdated: 'ニックネームを更新しました',
        nicknameUpdateFailed: 'ニックネームの更新に失敗しました',
        sasConfirmedToast: '安全コードの一致を確認しました。チャットを開始できます',
        setNicknamePrompt: 'ニックネームを設定してください（相手に表示されます）：',
        clearDataConfirm: 'この端末のすべてのローカルデータを消去しますか？\n\nこのブラウザに保存された暗号化身元とすべてのローカルデータを削除し、元に戻せません（サーバーには元々何も保存されていません）。消去後は「パスフレーズを設定」に戻って最初からやり直します。'
      }
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
      send: 'Enviar',
      p2p: {
        headerTitle: '💬 Chat seguro P2P',
        editNicknameTitle: 'Haz clic para cambiar tu apodo (visible para tu par)',
        mePrefix: 'Yo: ',
        unnamed: 'Sin nombre',
        badgeVerifiedTitle: 'Los mensajes están cifrados de extremo a extremo y has verificado el código de seguridad fuera de banda: no hay intermediario',
        badgeVerified: '🔒 Cifrado · Verificado',
        badgeEncryptedTitle: 'Los mensajes están cifrados de extremo a extremo, pero el código de seguridad no se ha verificado fuera de banda, así que no se puede descartar un intermediario',
        badgePendingSas: '🔒 Cifrado · Verifica el código de seguridad',
        badgeHandshaking: '🔄 Asegurando la conexión…',
        badgeFailed: '⛔ Verificación fallida',
        aboutTitle: 'Acerca de / Privacidad y datos locales',
        aboutToggle: 'ⓘ Acerca de',
        sasDialogTitle: '🛡️ Verificar código de seguridad',
        sasDialogBodyLine1: 'Léanse mutuamente los dígitos de abajo por un canal de confianza (teléfono / en persona).',
        sasDialogBodyLine2: 'Solo si coinciden no hay intermediario: este es el paso más importante.',
        peerPrefix: 'Par: ',
        sasAgree: '✓ Coinciden, empezar a chatear',
        sasDisagree: '✗ No coinciden, desconectar',
        sasBarLabel: '🛡️ Código de seguridad',
        sasVerifiedMark: '✓ Coincidencia verificada',
        createRoomTitle: 'Crea una sala estrictamente uno a uno: una vez que entren 2 personas, cualquier otra con el enlace será rechazada por el servidor (Room full).',
        createRoomBtn: '🔗 Crear sala',
        oneToOneNote: '· Uno a uno (se bloquea tras 2)',
        joinRoomBtn: '🔌 Unirse a la sala',
        roomCreatedHeading: '🔗 Sala creada: envía el enlace a tu par; se une automáticamente cuando lo abre en un navegador',
        establishingEncrypted: '🔄 Estableciendo conexión cifrada…',
        waitingPeerJoin: '● Esperando a que el par se una…',
        roomLinkWarning: '⚠️ El enlace contiene un token de sala de un solo uso; envíalo por un canal de confianza. Tras conectar, verifica el «código de seguridad» de abajo con tu par por teléfono / en persona antes de chatear: este es el paso clave para descartar un intermediario (incluido un servidor de señalización malicioso).',
        copyLink: '📋 Copiar enlace',
        collapse: 'Contraer',
        aboutPrivacyTitle: 'Los mensajes están cifrados de extremo a extremo y se envían punto a punto; el servidor solo retransmite el emparejamiento y nunca maneja ni almacena ningún mensaje',
        aboutPrivacyBody: '🔒 El servidor no guarda ningún historial de chat; los mensajes están cifrados de extremo a extremo y se envían punto a punto. El historial de chat solo vive en el navegador de este dispositivo (se borra al cerrar la página, nunca se sube).',
        clearDataTitle: 'Elimina la identidad y todos los datos locales guardados en este navegador, volviendo al estado inicial',
        clearDataBtn: 'Borrar datos locales',
        emptyConnected: 'Canal cifrado establecido: envía un mensaje para empezar a chatear.',
        emptyDisconnected: 'Haz clic en «🔗 Crear sala» para generar un enlace para tu par,\no abre un enlace que te hayan enviado, para iniciar un chat cifrado de extremo a extremo.',
        placeholderWaitingSecure: 'Esperando el canal seguro…',
        placeholderConfirmSas: 'Primero verifica el código de seguridad y pulsa «Coinciden»…',
        joinRoomDialogTitle: '🔌 Unirse a la sala',
        pasteRoomLink: 'Pega el enlace de sala que te envió tu par:',
        cancel: 'Cancelar',
        join: 'Unirse',
        loadIdentityFailed: 'No se pudo leer la identidad local. Actualiza la página e inténtalo de nuevo.',
        identityIncomplete: 'La identidad local está incompleta; no se puede establecer un canal cifrado. Restablece tu identidad e inténtalo de nuevo.',
        secureChannelFailed: 'No se pudo establecer el canal cifrado. Inténtalo de nuevo.',
        e2eEstablished: '🔐 Canal cifrado de extremo a extremo establecido. Verifica el código de seguridad de abajo con tu par antes de chatear.',
        e2eEstablishing: '🔐 Estableciendo canal cifrado de extremo a extremo…',
        peerVerifyFailed: '⛔ Falló la verificación de identidad del par: puede haber un intermediario. Desconectado.',
        relayNotice: '🔒 Te conectarás a tu par cifrado a través de un servidor de retransmisión; tu IP real no se expone a tu par.',
        connectedEstablishing: '✅ Conectado al par, estableciendo cifrado de extremo a extremo…',
        connectFailed: 'No se pudo conectar. Inténtalo de nuevo.',
        peerDisconnected: 'La conexión con tu par se ha cerrado.',
        peerJoinedConnecting: 'El par se unió, conectando…',
        negotiationFailed: 'Falló la negociación de la conexión. Inténtalo de nuevo.',
        negotiationError: 'Error en la negociación de la conexión. Inténtalo de nuevo.',
        peerLeft: 'Tu par salió; esta sesión ha terminado.',
        signalingError: 'El servicio de conexión tuvo un error. Inténtalo más tarde.',
        roomReadyWaiting: 'Sala lista, esperando a que el par se una…',
        joinedConnecting: 'Te uniste a la sala, conectando con el par…',
        serverConnectFailed: 'No se puede conectar al servidor. Revisa tu red e inténtalo de nuevo.',
        notSecureYet: 'El canal seguro no está listo; no se pueden enviar mensajes',
        verifySasFirst: 'Primero verifica el código de seguridad con tu par por teléfono / en persona y confirma que coincide, luego envía mensajes',
        disconnectedManual: 'Desconectado',
        copiedToClipboard: 'Copiado al portapapeles',
        relayNotReady: 'El servidor de retransmisión no está listo y la conexión puede fallar. Si sigue sin estar disponible, contacta al administrador del sitio.',
        sasMismatch: 'El código de seguridad no coincide: posible intermediario. Desconectado.',
        nicknameUpdated: 'Apodo actualizado',
        nicknameUpdateFailed: 'No se pudo actualizar el apodo',
        sasConfirmedToast: 'Código de seguridad confirmado como coincidente: puedes empezar a chatear',
        setNicknamePrompt: 'Configura tu apodo (visible para tu par):',
        clearDataConfirm: '¿Borrar todos los datos locales de este dispositivo?\n\nEsto elimina la identidad cifrada y todos los datos locales guardados en este navegador, y no se puede deshacer (el servidor no almacena nada de todos modos). Después vuelves a «Establecer contraseña» y empiezas de nuevo.'
      }
    }
  }
};
