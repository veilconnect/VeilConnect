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
      invalidRoomLink: string;
      roomCodeBtn: string;
      roomCodeTitle: string;
      roomCodeDialogTitle: string;
      roomCodeDialogBody: string;
      roomCodePlaceholder: string;
      roomCodeSecurityHint: string;
      roomCodeCreateBtn: string;
      roomCodeJoinBtn: string;
      roomCodeTooShort: string;
      roomCodeShareLabel: string;
      roomCodeShareHint: string;
      disconnectedManual: string;
      copiedToClipboard: string;
      relayNotReady: string;
      sasMismatch: string;
      nicknameUpdated: string;
      nicknameUpdateFailed: string;
      sasConfirmedToast: string;
      setNicknamePrompt: string;
      clearDataConfirm: string;
      // —— 配对码（自动抗 MITM）——
      pairUseToggle: string;
      pairCodeLabel: string;
      pairShareHint: string;
      pairEnterTitle: string;
      pairEnterBody: string;
      pairEnterPlaceholder: string;
      pairConfirmBtn: string;
      pairVerifyingBadge: string;
      pairVerifiedBadge: string;
      pairVerifiedMark: string;
      pairBarLabel: string;
      pairFailed: string;
      pairMissingCode: string;
      pairTimedOut: string;
      pairJoinOptional: string;
      // —— 异步文件(网盘式)——
      blobShareBtn: string;
      blobShareTitle: string;
      blobUploading: string;
      blobPasswordPrompt: string;
      blobReady: string;
      blobFailed: string;
      blobTooLarge: string;
      blobLinkHeading: string;
      blobLinkHint: string;
      // —— 文件 / 图片传输 ——
      file: {
        attachTitle: string;
        busy: string;
        tooLarge: string;
        readFailed: string;
        offerFailed: string;
        sending: string;
        receiving: string;
        completed: string;
        failed: string;
        cancelled: string;
        verifyFailed: string;
        incoming: string;
        sent: string;
        received: string;
        download: string;
        cancel: string;
        imageAlt: string;
      };
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
        invalidRoomLink: '房间链接无效，应形如 https://…/#room=xxx&t=yyy',
        roomCodeBtn: '🔢 房间号',
        roomCodeTitle: '用约定的房间号连接（无需发送长链接）',
        roomCodeDialogTitle: '用房间号连接',
        roomCodeDialogBody: '两人约定同一个房间号：一方点「创建」，另一方点「加入」。无需互发那串很长的房间链接。',
        roomCodePlaceholder: '输入约定的房间号（至少 8 个字符）',
        roomCodeSecurityHint: '房间号只是会合标识、可能被他人猜中；真正防中间人靠握手后核对安全码/配对码——请务必核对。',
        roomCodeCreateBtn: '创建房间',
        roomCodeJoinBtn: '加入房间',
        roomCodeTooShort: '房间号太短（至少 8 个字符）',
        roomCodeShareLabel: '把这个房间号告诉对方：',
        roomCodeShareHint: '让对方在「房间号」里点「加入房间」、输入同一个号码即可连接。记得核对安全码/配对码。',
        disconnectedManual: '已断开连接',
        copiedToClipboard: '已复制到剪贴板',
        relayNotReady: '中继服务器未就绪，可能无法连接。如长时间连不上，请联系站点管理员。',
        sasMismatch: '安全码不一致，疑似中间人，已断开',
        nicknameUpdated: '昵称已更新',
        nicknameUpdateFailed: '昵称更新失败',
        sasConfirmedToast: '已确认安全码一致，可以开始聊天',
        setNicknamePrompt: '设置你的昵称（对方会看到）：',
        clearDataConfirm: '清除本设备的全部本地数据？\n\n将删除本浏览器内保存的加密身份与所有本地数据，且不可恢复（服务器本就不存任何数据）。清除后回到「设置口令」从头开始。',
        pairUseToggle: '用配对码自动验证（免手动核对安全码）',
        pairCodeLabel: '配对码',
        pairShareHint: '⚠️ 请通过【另一条可信渠道】（当面/电话/已加密的其他 App）把配对码告诉对方，切勿与上面的链接走同一渠道，否则形同虚设。',
        pairEnterTitle: '🔑 输入配对码',
        pairEnterBody: '对方启用了配对码验证。请输入对方通过可信渠道告知你的配对码，以自动确认无中间人。',
        pairEnterPlaceholder: '例如 ABCD-1234-EFGH-…',
        pairConfirmBtn: '确认',
        pairVerifyingBadge: '🔒 已加密 · 配对码验证中',
        pairVerifiedBadge: '🔐 配对码已验证',
        pairVerifiedMark: '✓ 配对码已验证（自动抗中间人）',
        pairBarLabel: '配对码验证：',
        pairFailed: '配对码不匹配或存在中间人，已断开',
        pairMissingCode: '请输入完整配对码（系统生成的那串）再继续',
        pairTimedOut: '配对码验证超时，已断开（请确认双方用的是同一个码）',
        pairJoinOptional: '配对码（可选；对方启用时填写，将自动验证免去手动核对安全码）',
        blobShareBtn: '📤 发文件得链接',
        blobShareTitle: '加密上传文件,得一条分享链接(对方无需在线,凭链接即可下载)',
        blobUploading: '加密上传中…',
        blobPasswordPrompt: '可选:设置提取密码(留空=仅凭链接即可下载)。设了密码则对方需链接+密码。',
        blobReady: '✅ 分享链接已生成(文件已加密上传)',
        blobFailed: '文件上传失败',
        blobTooLarge: '文件过大:托管版单次上传上限约 95MB(受 Cloudflare 100MB 请求体限制)。更大文件需多分片上传(暂未支持)。',
        blobLinkHeading: '📦 文件分享链接(含解密密钥,经可信渠道发给对方)',
        blobLinkHint: '⚠️ 链接含解密密钥;对方打开即可下载解密,无需在线。默认 24 小时后过期。',
        file: {
          attachTitle: '发送文件或图片',
          busy: '已有文件正在发送，请等当前文件传完再发下一个',
          tooLarge: '文件超过 100 MB 上限，暂不支持',
          readFailed: '读取文件失败',
          offerFailed: '发送文件失败',
          sending: '发送中',
          receiving: '接收中',
          completed: '已完成',
          failed: '传输失败',
          cancelled: '已取消',
          verifyFailed: '文件校验失败（大小或哈希不符），已丢弃',
          incoming: '正在接收文件…',
          sent: '已发送',
          received: '已接收',
          download: '下载',
          cancel: '取消',
          imageAlt: '收到的图片'
        }
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
        invalidRoomLink: 'Invalid room link. It should look like https://…/#room=xxx&t=yyy',
        roomCodeBtn: '🔢 Room code',
        roomCodeTitle: 'Connect with an agreed room code (no long link to send)',
        roomCodeDialogTitle: 'Connect by room code',
        roomCodeDialogBody: 'Agree on the same room code: one person taps Create, the other taps Join. No need to send the long room link.',
        roomCodePlaceholder: 'Enter the agreed room code (min 8 chars)',
        roomCodeSecurityHint: 'A room code is only a rendezvous label and can be guessed; MITM protection still comes from verifying the safety code / pairing code after connecting — be sure to verify.',
        roomCodeCreateBtn: 'Create room',
        roomCodeJoinBtn: 'Join room',
        roomCodeTooShort: 'Room code too short (min 8 chars)',
        roomCodeShareLabel: 'Tell your peer this room code:',
        roomCodeShareHint: 'Have them open “Room code”, tap Join, and enter the same code. Remember to verify the safety/pairing code.',
        disconnectedManual: 'Disconnected',
        copiedToClipboard: 'Copied to clipboard',
        relayNotReady: 'The relay server is not ready and the connection may fail. If it stays unreachable, contact the site administrator.',
        sasMismatch: 'Safety code mismatch — possible man-in-the-middle. Disconnected.',
        nicknameUpdated: 'Nickname updated',
        nicknameUpdateFailed: 'Failed to update nickname',
        sasConfirmedToast: 'Safety code confirmed as matching — you can start chatting',
        setNicknamePrompt: 'Set your nickname (visible to your peer):',
        clearDataConfirm: 'Clear all local data on this device?\n\nThis deletes the encrypted identity and all local data saved in this browser, and cannot be undone (the server stores nothing anyway). Afterwards you return to “Set passphrase” and start over.',
        pairUseToggle: 'Use a pairing code (auto-verify, no manual safety-code check)',
        pairCodeLabel: 'Pairing code',
        pairShareHint: '⚠️ Share the pairing code with your peer over a DIFFERENT trusted channel (in person / phone / another encrypted app) — never through the same channel as the link above, or it provides no protection.',
        pairEnterTitle: '🔑 Enter pairing code',
        pairEnterBody: 'Your peer enabled pairing-code verification. Enter the code they gave you over a trusted channel to automatically confirm there is no man-in-the-middle.',
        pairEnterPlaceholder: 'e.g. ABCD-1234-EFGH-…',
        pairConfirmBtn: 'Confirm',
        pairVerifyingBadge: '🔒 Encrypted · verifying pairing code',
        pairVerifiedBadge: '🔐 Pairing code verified',
        pairVerifiedMark: '✓ Pairing code verified (auto anti-MITM)',
        pairBarLabel: 'Pairing code:',
        pairFailed: 'Pairing code mismatch or man-in-the-middle — disconnected',
        pairMissingCode: 'Enter the full pairing code (the system-generated one) first',
        pairTimedOut: 'Pairing verification timed out — disconnected (check both sides use the same code)',
        pairJoinOptional: 'Pairing code (optional; fill in if your peer enabled it — auto-verifies, no manual safety-code check)',
        blobShareBtn: '📤 Share a file (link)',
        blobShareTitle: 'Encrypt & upload a file, get a share link (recipient need not be online — they download via the link)',
        blobUploading: 'Encrypting & uploading…',
        blobPasswordPrompt: 'Optional: set a download password (leave empty = link alone is enough). If set, the recipient needs link + password.',
        blobReady: '✅ Share link created (file encrypted & uploaded)',
        blobFailed: 'File upload failed',
        blobTooLarge: 'File too large: hosted single upload is capped at ~95MB (Cloudflare 100MB request-body limit). Larger files need multipart upload (not yet supported).',
        blobLinkHeading: '📦 File share link (contains the decryption key — send via a trusted channel)',
        blobLinkHint: '⚠️ The link contains the decryption key; the recipient can download & decrypt without being online. Expires in 24h by default.',
        file: {
          attachTitle: 'Send a file or photo',
          busy: 'A file is already being sent — wait for it to finish before sending another',
          tooLarge: 'File exceeds the 100 MB limit',
          readFailed: 'Failed to read the file',
          offerFailed: 'Failed to send the file',
          sending: 'Sending',
          receiving: 'Receiving',
          completed: 'Completed',
          failed: 'Transfer failed',
          cancelled: 'Cancelled',
          verifyFailed: 'File verification failed (size or hash mismatch); discarded',
          incoming: 'Receiving a file…',
          sent: 'Sent',
          received: 'Received',
          download: 'Download',
          cancel: 'Cancel',
          imageAlt: 'Received image'
        }
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
        invalidRoomLink: 'ルームリンクが無効です。https://…/#room=xxx&t=yyy の形式である必要があります',
        roomCodeBtn: '🔢 ルーム番号',
        roomCodeTitle: '取り決めたルーム番号で接続（長いリンク送信不要）',
        roomCodeDialogTitle: 'ルーム番号で接続',
        roomCodeDialogBody: '同じルーム番号を取り決め、一方が「作成」、もう一方が「参加」を押します。長いルームリンクの送信は不要です。',
        roomCodePlaceholder: '取り決めたルーム番号を入力（8文字以上）',
        roomCodeSecurityHint: 'ルーム番号は待ち合わせ用の識別子で推測されうる。中間者対策は接続後の安全コード／ペアリングコードの照合で行うため、必ず照合してください。',
        roomCodeCreateBtn: 'ルーム作成',
        roomCodeJoinBtn: 'ルーム参加',
        roomCodeTooShort: 'ルーム番号が短すぎます（8文字以上）',
        roomCodeShareLabel: 'このルーム番号を相手に伝えてください：',
        roomCodeShareHint: '相手に「ルーム番号」から「参加」を押して同じ番号を入力してもらいます。安全／ペアリングコードの照合をお忘れなく。',
        disconnectedManual: '切断しました',
        copiedToClipboard: 'クリップボードにコピーしました',
        relayNotReady: '中継サーバーの準備ができておらず接続できない可能性があります。長時間つながらない場合はサイト管理者にお問い合わせください。',
        sasMismatch: '安全コードが一致しません。中間者の疑いがあるため切断しました。',
        nicknameUpdated: 'ニックネームを更新しました',
        nicknameUpdateFailed: 'ニックネームの更新に失敗しました',
        sasConfirmedToast: '安全コードの一致を確認しました。チャットを開始できます',
        setNicknamePrompt: 'ニックネームを設定してください（相手に表示されます）：',
        clearDataConfirm: 'この端末のすべてのローカルデータを消去しますか？\n\nこのブラウザに保存された暗号化身元とすべてのローカルデータを削除し、元に戻せません（サーバーには元々何も保存されていません）。消去後は「パスフレーズを設定」に戻って最初からやり直します。',
        pairUseToggle: 'ペアリングコードで自動検証（安全コードの手動照合が不要）',
        pairCodeLabel: 'ペアリングコード',
        pairShareHint: '⚠️ ペアリングコードは【別の信頼できる経路】（対面・電話・他の暗号化アプリ）で相手に伝えてください。上のリンクと同じ経路で送ると意味がありません。',
        pairEnterTitle: '🔑 ペアリングコードを入力',
        pairEnterBody: '相手がペアリングコード検証を有効にしています。信頼できる経路で受け取ったコードを入力すると、中間者がいないことを自動で確認します。',
        pairEnterPlaceholder: '例：ABCD-1234-EFGH-…',
        pairConfirmBtn: '確認',
        pairVerifyingBadge: '🔒 暗号化済み · ペアリングコード検証中',
        pairVerifiedBadge: '🔐 ペアリングコード検証済み',
        pairVerifiedMark: '✓ ペアリングコード検証済み（中間者を自動排除）',
        pairBarLabel: 'ペアリングコード検証：',
        pairFailed: 'ペアリングコードが一致しないか中間者の疑い。切断しました。',
        pairMissingCode: '完全なペアリングコード（システム生成のもの）を入力してください',
        pairTimedOut: 'ペアリング検証がタイムアウトしたため切断しました（双方が同じコードか確認してください）',
        pairJoinOptional: 'ペアリングコード（任意。相手が有効化した場合に入力。安全コードの手動照合が不要になります）',
        blobShareBtn: '📤 ファイルを共有(リンク)',
        blobShareTitle: 'ファイルを暗号化してアップロードし共有リンクを取得(相手がオンラインでなくてもリンクでDL可)',
        blobUploading: '暗号化してアップロード中…',
        blobPasswordPrompt: '任意:ダウンロードパスワードを設定(空=リンクのみでDL可)。設定すると相手はリンク+パスワードが必要。',
        blobReady: '✅ 共有リンクを生成(ファイルは暗号化してアップロード済み)',
        blobFailed: 'ファイルのアップロードに失敗',
        blobTooLarge: 'ファイルが大きすぎます:ホスト版の単一アップロード上限は約95MB(Cloudflareの100MBリクエスト制限)。それ以上はマルチパート必須(未対応)。',
        blobLinkHeading: '📦 ファイル共有リンク(復号鍵を含む。信頼できる経路で相手へ)',
        blobLinkHint: '⚠️ リンクに復号鍵が含まれます。相手はオンラインでなくてもDL・復号可。既定で24時間後に失効。',
        file: {
          attachTitle: 'ファイルまたは写真を送信',
          busy: '送信中のファイルがあります。完了してから次を送ってください',
          tooLarge: 'ファイルが 100 MB の上限を超えています',
          readFailed: 'ファイルの読み込みに失敗しました',
          offerFailed: 'ファイルの送信に失敗しました',
          sending: '送信中',
          receiving: '受信中',
          completed: '完了',
          failed: '転送失敗',
          cancelled: 'キャンセル済み',
          verifyFailed: 'ファイル検証に失敗（サイズまたはハッシュ不一致）。破棄しました',
          incoming: 'ファイルを受信中…',
          sent: '送信済み',
          received: '受信済み',
          download: 'ダウンロード',
          cancel: 'キャンセル',
          imageAlt: '受信した画像'
        }
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
        invalidRoomLink: 'Enlace de sala no válido. Debe verse como https://…/#room=xxx&t=yyy',
        roomCodeBtn: '🔢 Código de sala',
        roomCodeTitle: 'Conectar con un código de sala acordado (sin enviar enlace largo)',
        roomCodeDialogTitle: 'Conectar por código de sala',
        roomCodeDialogBody: 'Acuerden el mismo código de sala: una persona pulsa Crear y la otra Unirse. No hace falta enviar el enlace largo.',
        roomCodePlaceholder: 'Introduce el código de sala acordado (mín. 8 caracteres)',
        roomCodeSecurityHint: 'Un código de sala es solo un identificador de encuentro y puede adivinarse; la protección contra intermediarios sigue dependiendo de verificar el código de seguridad / emparejamiento tras conectar: verifícalo.',
        roomCodeCreateBtn: 'Crear sala',
        roomCodeJoinBtn: 'Unirse a la sala',
        roomCodeTooShort: 'Código de sala demasiado corto (mín. 8 caracteres)',
        roomCodeShareLabel: 'Dile a tu interlocutor este código de sala:',
        roomCodeShareHint: 'Que abra “Código de sala”, pulse Unirse e introduzca el mismo código. Recuerda verificar el código de seguridad/emparejamiento.',
        disconnectedManual: 'Desconectado',
        copiedToClipboard: 'Copiado al portapapeles',
        relayNotReady: 'El servidor de retransmisión no está listo y la conexión puede fallar. Si sigue sin estar disponible, contacta al administrador del sitio.',
        sasMismatch: 'El código de seguridad no coincide: posible intermediario. Desconectado.',
        nicknameUpdated: 'Apodo actualizado',
        nicknameUpdateFailed: 'No se pudo actualizar el apodo',
        sasConfirmedToast: 'Código de seguridad confirmado como coincidente: puedes empezar a chatear',
        setNicknamePrompt: 'Configura tu apodo (visible para tu par):',
        clearDataConfirm: '¿Borrar todos los datos locales de este dispositivo?\n\nEsto elimina la identidad cifrada y todos los datos locales guardados en este navegador, y no se puede deshacer (el servidor no almacena nada de todos modos). Después vuelves a «Establecer contraseña» y empiezas de nuevo.',
        pairUseToggle: 'Usar un código de emparejamiento (verificación automática, sin cotejo manual)',
        pairCodeLabel: 'Código de emparejamiento',
        pairShareHint: '⚠️ Comparte el código de emparejamiento con tu par por un canal de confianza DISTINTO (en persona / teléfono / otra app cifrada); nunca por el mismo canal que el enlace de arriba, o no protege nada.',
        pairEnterTitle: '🔑 Introduce el código de emparejamiento',
        pairEnterBody: 'Tu par activó la verificación por código de emparejamiento. Introduce el código que te dio por un canal de confianza para confirmar automáticamente que no hay intermediario.',
        pairEnterPlaceholder: 'p. ej. ABCD-1234-EFGH-…',
        pairConfirmBtn: 'Confirmar',
        pairVerifyingBadge: '🔒 Cifrado · verificando código de emparejamiento',
        pairVerifiedBadge: '🔐 Código de emparejamiento verificado',
        pairVerifiedMark: '✓ Código de emparejamiento verificado (anti-MITM automático)',
        pairBarLabel: 'Código de emparejamiento:',
        pairFailed: 'Código de emparejamiento incorrecto o intermediario: desconectado',
        pairMissingCode: 'Introduce primero el código de emparejamiento completo (el generado por el sistema)',
        pairTimedOut: 'La verificación del emparejamiento expiró: desconectado (comprueba que ambos usáis el mismo código)',
        pairJoinOptional: 'Código de emparejamiento (opcional; rellénalo si tu par lo activó — verifica automáticamente, sin cotejo manual)',
        blobShareBtn: '📤 Compartir archivo (enlace)',
        blobShareTitle: 'Cifra y sube un archivo, obtén un enlace (el destinatario no necesita estar en línea; descarga por el enlace)',
        blobUploading: 'Cifrando y subiendo…',
        blobPasswordPrompt: 'Opcional: define una contraseña de descarga (vacío = basta el enlace). Si la pones, el destinatario necesita enlace + contraseña.',
        blobReady: '✅ Enlace de descarga creado (archivo cifrado y subido)',
        blobFailed: 'Error al subir el archivo',
        blobTooLarge: 'Archivo demasiado grande: la subida única en la versión alojada se limita a ~95MB (límite de 100MB de Cloudflare). Archivos mayores requieren multipart (aún no soportado).',
        blobLinkHeading: '📦 Enlace del archivo (contiene la clave de descifrado — envíalo por un canal de confianza)',
        blobLinkHint: '⚠️ El enlace contiene la clave de descifrado; el destinatario puede descargar y descifrar sin estar en línea. Caduca en 24 h por defecto.',
        file: {
          attachTitle: 'Enviar un archivo o foto',
          busy: 'Ya se está enviando un archivo; espera a que termine antes de enviar otro',
          tooLarge: 'El archivo supera el límite de 100 MB',
          readFailed: 'No se pudo leer el archivo',
          offerFailed: 'No se pudo enviar el archivo',
          sending: 'Enviando',
          receiving: 'Recibiendo',
          completed: 'Completado',
          failed: 'Transferencia fallida',
          cancelled: 'Cancelado',
          verifyFailed: 'Verificación del archivo fallida (tamaño o hash no coinciden); descartado',
          incoming: 'Recibiendo un archivo…',
          sent: 'Enviado',
          received: 'Recibido',
          download: 'Descargar',
          cancel: 'Cancelar',
          imageAlt: 'Imagen recibida'
        }
      }
    }
  },
  'zh-TW': {
    appTitle: 'VeilConnect',
    appSubtitle: 'P2P 加密聊天',
    appDescription: '一款 P2P 端對端加密聊天應用程式，不依賴中央伺服器即可確保你的通訊隱私與安全。',

    welcome: {
      title: 'VeilConnect',
      subtitle: 'P2P 加密聊天',
      description: '歡迎使用 VeilConnect！這是一款 P2P 端對端加密聊天應用程式，不依賴中央伺服器即可確保你的通訊隱私與安全。',
      features: {
        title: '🔐 核心功能',
        encryption: '• 端對端加密（XSalsa20-Poly1305）',
        p2p: '• P2P 直接通訊（WebRTC）',
        customId: '• 自訂使用者 ID',
        fileTransfer: '• 支援檔案傳輸',
        decentralized: '• 完全去中心化'
      },
      startButton: '開始使用'
    },

    identity: {
      generateButton: '產生新身分',
      clearButton: '清除身分',
      status: {
        active: '✅ 身分已啟用',
        inactive: 'ℹ️ 請先產生身分',
        pleaseGenerate: '請先產生身分'
      },
      userId: '使用者 ID：',
      nickname: '暱稱：',
      publicKey: '公鑰：',
      privateKey: '私鑰：'
    },

    encryption: {
      title: '🔐 加密測試',
      inputPlaceholder: '輸入要加密的文字',
      testButton: '測試加密',
      original: '原始內容：',
      encrypted: '加密後：',
      decrypted: '解密後：',
      success: '✅ 加密測試成功',
      error: '加密測試失敗',
      pleaseGenerateIdentity: '請先產生身分',
      pleaseEnterText: '請輸入要加密的文字'
    },

    system: {
      title: '📊 系統狀態',
      identityStatus: '身分狀態：',
      messageCount: '訊息數量：',
      contactCount: '聯絡人數量：',
      uptime: '運行時間：',
      seconds: '秒'
    },

    features: {
      title: '🚀 核心功能展示',
      encryptionDemo: {
        title: '🔐 端對端加密',
        description: '以 XSalsa20-Poly1305 演算法保護訊息安全',
        button: '展示加密'
      },
      identityDemo: {
        title: '🆔 使用者身分',
        description: '以 Ed25519 公鑰為基礎的唯一身分',
        button: '展示身分'
      },
      storageDemo: {
        title: '💾 本機儲存',
        description: '在本機加密儲存訊息與聯絡人',
        button: '展示儲存'
      },
      p2pDemo: {
        title: '🌐 P2P 連線',
        description: 'WebRTC 直接通訊（需兩個用戶端）',
        button: '展示 P2P'
      }
    },

    log: {
      title: '📝 系統記錄',
      clearButton: '清除記錄',
      cleared: '記錄已清除'
    },

    settings: {
      title: '⚙️ 設定',
      language: '語言',
      theme: '佈景主題',
      notifications: '通知'
    },

    common: {
      save: '儲存',
      cancel: '取消',
      confirm: '確認',
      delete: '刪除',
      edit: '編輯',
      close: '關閉',
      back: '上一步',
      next: '下一步',
      loading: '載入中…',
      error: '錯誤',
      success: '成功',
      warning: '警告',
      info: '資訊'
    },

    completion: {
      title: '身分建立成功！',
      description: '🎉 恭喜！你已成功建立 VeilConnect 身分。現在可以與其他使用者建立安全的 P2P 連線了。',
      idType: '身分類型：',
      restartButton: '重設',
      chatButton: '開始聊天',
      chatComingSoon: '聊天功能開發中…'
    },

    chat: {
      needIdentity: '需要身分',
      generateFirst: '請先產生身分才能開始聊天',
      notConnected: '尚未連線',
      connecting: '連線中',
      connected: 'P2P 連線已建立',
      disconnected: 'P2P 連線已中斷',
      encrypted: '加密通訊',
      offline: '離線',
      createConnection: '建立',
      joinConnection: '加入',
      disconnect: '中斷連線',
      connect: '連線',
      typePlaceholder: '輸入訊息…',
      connectToSend: '先與對方連線才能傳送訊息',
      shareConnection: '分享連線',
      shareInstructions: '把這個連線 ID 分享給你的朋友：',
      joinInstructions: '輸入朋友提供的連線 ID：',
      connectionIdPlaceholder: '在此貼上連線 ID',
      waitingConnection: '等待對方連線',
      connectionFailed: '建立連線失敗',
      joinFailed: '加入連線失敗',
      sendFailed: '傳送訊息失敗',
      idCopied: '連線 ID 已複製到剪貼簿',
      send: '傳送',
      p2p: {
        headerTitle: '💬 P2P 安全聊天',
        editNicknameTitle: '點按以變更你的暱稱（對方可見）',
        mePrefix: '我：',
        unnamed: '未命名',
        badgeVerifiedTitle: '訊息已端對端加密，且你已透過其他管道核對安全碼——沒有中間人',
        badgeVerified: '🔒 已加密 · 已驗證',
        badgeEncryptedTitle: '訊息已端對端加密，但尚未透過其他管道核對安全碼，因此無法排除中間人',
        badgePendingSas: '🔒 已加密 · 請核對安全碼',
        badgeHandshaking: '🔄 建立安全連線中…',
        badgeFailed: '⛔ 驗證失敗',
        aboutTitle: '關於 / 隱私與本機資料',
        aboutToggle: 'ⓘ 關於',
        sasDialogTitle: '🛡️ 核對安全碼',
        sasDialogBodyLine1: '透過可信任的管道（電話／當面）互相唸出下方的數字。',
        sasDialogBodyLine2: '只有在完全相符時才代表沒有中間人——這是最重要的一步。',
        peerPrefix: '對方：',
        sasAgree: '✓ 完全相符，開始聊天',
        sasDisagree: '✗ 不相符，中斷連線',
        sasBarLabel: '🛡️ 安全碼',
        sasVerifiedMark: '✓ 已驗證相符',
        createRoomTitle: '建立嚴格的一對一房間：一旦 2 人加入，任何其他持有連結的人都會被伺服器拒絕（房間已滿）。',
        createRoomBtn: '🔗 建立房間',
        oneToOneNote: '· 一對一（2 人加入後鎖定）',
        joinRoomBtn: '🔌 加入房間',
        roomCreatedHeading: '🔗 房間已建立——把連結傳給對方；對方在瀏覽器開啟後會自動加入',
        establishingEncrypted: '🔄 建立加密連線中…',
        waitingPeerJoin: '● 等待對方加入…',
        roomLinkWarning: '⚠️ 此連結含有一次性的房間權杖，請透過可信任的管道傳送。連線後，請先與對方以電話／當面核對下方的「安全碼」再開始聊天——這是排除中間人（包含惡意信令伺服器）的關鍵步驟。',
        copyLink: '📋 複製連結',
        collapse: '收合',
        aboutPrivacyTitle: '訊息已端對端加密並以點對點方式傳送；伺服器僅負責中繼配對，絕不處理或儲存任何訊息',
        aboutPrivacyBody: '🔒 伺服器不會儲存任何聊天記錄；訊息已端對端加密並以點對點方式傳送。聊天記錄只存在這台裝置的瀏覽器中（關閉頁面即清除，絕不上傳）。',
        clearDataTitle: '刪除身分以及這個瀏覽器中儲存的所有本機資料，回到初始狀態',
        clearDataBtn: '清除本機資料',
        emptyConnected: '加密通道已建立——傳送訊息即可開始聊天。',
        emptyDisconnected: '點按「🔗 建立房間」為對方產生連結，\n或開啟對方傳給你的連結，即可開始端對端加密聊天。',
        placeholderWaitingSecure: '等待安全通道建立…',
        placeholderConfirmSas: '請先核對安全碼並點按「完全相符」…',
        joinRoomDialogTitle: '🔌 加入房間',
        pasteRoomLink: '貼上對方傳給你的房間連結：',
        cancel: '取消',
        join: '加入',
        loadIdentityFailed: '讀取本機身分失敗。請重新整理頁面後再試一次。',
        identityIncomplete: '本機身分不完整，無法建立加密通道。請重設身分後再試一次。',
        secureChannelFailed: '建立加密通道失敗。請再試一次。',
        e2eEstablished: '🔐 端對端加密通道已建立。請先與對方核對下方安全碼再開始聊天。',
        e2eEstablishing: '🔐 建立端對端加密通道中…',
        peerVerifyFailed: '⛔ 對方身分驗證失敗——可能有中間人。已中斷連線。',
        relayNotice: '🔒 你將透過中繼伺服器以加密方式連線到對方；你的真實 IP 不會暴露給對方。',
        connectedEstablishing: '✅ 已連線到對方，正在建立端對端加密…',
        connectFailed: '連線失敗。請再試一次。',
        peerDisconnected: '與對方的連線已關閉。',
        peerJoinedConnecting: '對方已加入，連線中…',
        negotiationFailed: '連線協商失敗。請再試一次。',
        negotiationError: '連線協商發生錯誤。請再試一次。',
        peerLeft: '對方已離開，本次工作階段已結束。',
        signalingError: '連線服務發生錯誤。請稍後再試。',
        roomReadyWaiting: '房間就緒，等待對方加入…',
        joinedConnecting: '已加入房間，正在連線到對方…',
        serverConnectFailed: '無法連線到伺服器。請檢查網路後再試一次。',
        notSecureYet: '安全通道尚未就緒，無法傳送訊息',
        verifySasFirst: '請先與對方以電話／當面核對安全碼並確認相符，再傳送訊息',
        invalidRoomLink: '無效的房間連結。格式應類似 https://…/#room=xxx&t=yyy',
        roomCodeBtn: '🔢 房間號',
        roomCodeTitle: '以約定好的房間號連線（不必傳送冗長的連結）',
        roomCodeDialogTitle: '以房間號連線',
        roomCodeDialogBody: '約定相同的房間號：一人點「建立」，另一人點「加入」。不必傳送冗長的房間連結。',
        roomCodePlaceholder: '輸入約定好的房間號（至少 8 個字元）',
        roomCodeSecurityHint: '房間號只是一個會合標籤，是可能被猜中的；防範中間人仍須在連線後核對安全碼／配對碼——請務必核對。',
        roomCodeCreateBtn: '建立房間',
        roomCodeJoinBtn: '加入房間',
        roomCodeTooShort: '房間號太短（至少 8 個字元）',
        roomCodeShareLabel: '把這個房間號告訴對方：',
        roomCodeShareHint: '請對方開啟「房間號」、點「加入」並輸入相同的號碼。記得核對安全碼／配對碼。',
        disconnectedManual: '已中斷連線',
        copiedToClipboard: '已複製到剪貼簿',
        relayNotReady: '中繼伺服器尚未就緒，連線可能失敗。若持續無法連線，請聯絡網站管理員。',
        sasMismatch: '安全碼不相符——可能有中間人。已中斷連線。',
        nicknameUpdated: '暱稱已更新',
        nicknameUpdateFailed: '更新暱稱失敗',
        sasConfirmedToast: '安全碼已確認相符——可以開始聊天了',
        setNicknamePrompt: '設定你的暱稱（對方可見）：',
        clearDataConfirm: '要清除這台裝置上的所有本機資料嗎？\n\n這會刪除加密身分以及這個瀏覽器中儲存的所有本機資料，且無法復原（反正伺服器本來就不儲存任何東西）。之後你會回到「設定通關密語」並重新開始。',
        pairUseToggle: '使用配對碼（自動驗證，無須手動核對安全碼）',
        pairCodeLabel: '配對碼',
        pairShareHint: '⚠️ 請透過「不同的」可信任管道（當面／電話／另一個加密應用程式）把配對碼分享給對方——切勿透過與上方連結相同的管道傳送，否則就毫無保護作用。',
        pairEnterTitle: '🔑 輸入配對碼',
        pairEnterBody: '對方已啟用配對碼驗證。請輸入對方透過可信任管道提供給你的配對碼，以自動確認沒有中間人。',
        pairEnterPlaceholder: '例如 ABCD-1234-EFGH-…',
        pairConfirmBtn: '確認',
        pairVerifyingBadge: '🔒 已加密 · 正在驗證配對碼',
        pairVerifiedBadge: '🔐 配對碼已驗證',
        pairVerifiedMark: '✓ 配對碼已驗證（自動防範中間人）',
        pairBarLabel: '配對碼：',
        pairFailed: '配對碼不相符或有中間人——已中斷連線',
        pairMissingCode: '請先輸入完整的配對碼（系統產生的那組）',
        pairTimedOut: '配對驗證逾時——已中斷連線（請確認雙方使用相同的配對碼）',
        pairJoinOptional: '配對碼（選填；若對方已啟用請填入——會自動驗證，無須手動核對安全碼）',
        blobShareBtn: '📤 分享檔案（連結）',
        blobShareTitle: '加密並上傳檔案，取得分享連結（收件者不必在線——可透過連結下載）',
        blobUploading: '加密並上傳中…',
        blobPasswordPrompt: '選填：設定下載密碼（留空＝只憑連結即可）。若設定，收件者需要連結＋密碼。',
        blobReady: '✅ 分享連結已建立（檔案已加密並上傳）',
        blobFailed: '檔案上傳失敗',
        blobTooLarge: '檔案太大：託管版單次上傳上限約為 ~95MB（Cloudflare 100MB 請求本體限制）。更大的檔案需要分段上傳（multipart，尚未支援）。',
        blobLinkHeading: '📦 檔案分享連結（內含解密金鑰——請透過可信任管道傳送）',
        blobLinkHint: '⚠️ 此連結內含解密金鑰；收件者不必在線即可下載並解密。預設 24h 後到期。',
        file: {
          attachTitle: '傳送檔案或相片',
          busy: '已有檔案正在傳送中——請等它傳完再傳送下一個',
          tooLarge: '檔案超過 100 MB 上限',
          readFailed: '讀取檔案失敗',
          offerFailed: '傳送檔案失敗',
          sending: '傳送中',
          receiving: '接收中',
          completed: '已完成',
          failed: '傳輸失敗',
          cancelled: '已取消',
          verifyFailed: '檔案驗證失敗（大小或雜湊不符）；已捨棄',
          incoming: '正在接收檔案…',
          sent: '已傳送',
          received: '已接收',
          download: '下載',
          cancel: '取消',
          imageAlt: '收到的圖片'
        }
      }
    }
  },
  'ko': {
    appTitle: 'VeilConnect',
    appSubtitle: 'P2P 암호화 채팅',
    appDescription: '중앙 서버에 의존하지 않고 통신의 프라이버시와 보안을 보장하는 P2P 종단 간 암호화 채팅 애플리케이션입니다.',

    welcome: {
      title: 'VeilConnect',
      subtitle: 'P2P 암호화 채팅',
      description: 'VeilConnect에 오신 것을 환영합니다! 중앙 서버에 의존하지 않고 통신의 프라이버시와 보안을 보장하는 P2P 종단 간 암호화 채팅 애플리케이션입니다.',
      features: {
        title: '🔐 핵심 기능',
        encryption: '• 종단 간 암호화 (XSalsa20-Poly1305)',
        p2p: '• P2P 직접 통신 (WebRTC)',
        customId: '• 사용자 ID 직접 지정',
        fileTransfer: '• 파일 전송 지원',
        decentralized: '• 완전한 탈중앙화'
      },
      startButton: '시작하기'
    },

    identity: {
      generateButton: '새 신원 생성',
      clearButton: '신원 지우기',
      status: {
        active: '✅ 신원 활성화됨',
        inactive: 'ℹ️ 먼저 신원을 생성해 주세요',
        pleaseGenerate: '먼저 신원을 생성해 주세요'
      },
      userId: '사용자 ID:',
      nickname: '닉네임:',
      publicKey: '공개 키:',
      privateKey: '개인 키:'
    },

    encryption: {
      title: '🔐 암호화 테스트',
      inputPlaceholder: '암호화할 텍스트를 입력하세요',
      testButton: '암호화 테스트',
      original: '원문:',
      encrypted: '암호문:',
      decrypted: '복호화 결과:',
      success: '✅ 암호화 테스트 성공',
      error: '암호화 테스트 실패',
      pleaseGenerateIdentity: '먼저 신원을 생성해 주세요',
      pleaseEnterText: '암호화할 텍스트를 입력해 주세요'
    },

    system: {
      title: '📊 시스템 상태',
      identityStatus: '신원 상태:',
      messageCount: '메시지 수:',
      contactCount: '연락처 수:',
      uptime: '가동 시간:',
      seconds: '초'
    },

    features: {
      title: '🚀 핵심 기능 데모',
      encryptionDemo: {
        title: '🔐 종단 간 암호화',
        description: 'XSalsa20-Poly1305 알고리즘으로 메시지를 안전하게 보호합니다',
        button: '암호화 데모'
      },
      identityDemo: {
        title: '🆔 사용자 신원',
        description: 'Ed25519 공개 키 기반의 고유한 신원',
        button: '신원 데모'
      },
      storageDemo: {
        title: '💾 로컬 저장소',
        description: '메시지와 연락처를 로컬에 암호화하여 저장',
        button: '저장소 데모'
      },
      p2pDemo: {
        title: '🌐 P2P 연결',
        description: 'WebRTC 직접 통신 (클라이언트 두 대 필요)',
        button: 'P2P 데모'
      }
    },

    log: {
      title: '📝 시스템 로그',
      clearButton: '로그 지우기',
      cleared: '로그가 지워졌습니다'
    },

    settings: {
      title: '⚙️ 설정',
      language: '언어',
      theme: '테마',
      notifications: '알림'
    },

    common: {
      save: '저장',
      cancel: '취소',
      confirm: '확인',
      delete: '삭제',
      edit: '편집',
      close: '닫기',
      back: '뒤로',
      next: '다음',
      loading: '불러오는 중...',
      error: '오류',
      success: '성공',
      warning: '경고',
      info: '정보'
    },

    completion: {
      title: '신원이 성공적으로 생성되었습니다!',
      description: '🎉 축하합니다! VeilConnect 신원을 성공적으로 만들었습니다. 이제 다른 사용자와 안전한 P2P 연결을 맺을 수 있습니다.',
      idType: 'ID 유형:',
      restartButton: '재설정',
      chatButton: '채팅 시작',
      chatComingSoon: '채팅 기능은 개발 중입니다...'
    },

    chat: {
      needIdentity: '신원 필요',
      generateFirst: '채팅을 시작하려면 먼저 신원을 생성해 주세요',
      notConnected: '연결되지 않음',
      connecting: '연결 중',
      connected: 'P2P 연결이 설정되었습니다',
      disconnected: 'P2P 연결이 끊어졌습니다',
      encrypted: '암호화 통신',
      offline: '오프라인',
      createConnection: '생성',
      joinConnection: '참여',
      disconnect: '연결 끊기',
      connect: '연결',
      typePlaceholder: '메시지를 입력하세요...',
      connectToSend: '메시지를 보내려면 상대방과 연결하세요',
      shareConnection: '연결 공유',
      shareInstructions: '이 연결 ID를 친구에게 공유하세요:',
      joinInstructions: '친구에게 받은 연결 ID를 입력하세요:',
      connectionIdPlaceholder: '여기에 연결 ID를 붙여넣으세요',
      waitingConnection: '상대방의 연결을 기다리는 중',
      connectionFailed: '연결 생성에 실패했습니다',
      joinFailed: '연결 참여에 실패했습니다',
      sendFailed: '메시지 전송에 실패했습니다',
      idCopied: '연결 ID가 클립보드에 복사되었습니다',
      send: '전송',
      p2p: {
        headerTitle: '💬 P2P 보안 채팅',
        editNicknameTitle: '클릭하여 닉네임 변경 (상대방에게 표시됨)',
        mePrefix: '나: ',
        unnamed: '이름 없음',
        badgeVerifiedTitle: '메시지는 종단 간 암호화되어 있으며, 별도 경로로 보안 코드를 검증했습니다 — 중간자 공격 없음',
        badgeVerified: '🔒 암호화됨 · 검증됨',
        badgeEncryptedTitle: '메시지는 종단 간 암호화되어 있지만, 보안 코드가 별도 경로로 검증되지 않아 중간자 공격을 배제할 수 없습니다',
        badgePendingSas: '🔒 암호화됨 · 보안 코드 검증 필요',
        badgeHandshaking: '🔄 연결을 보호하는 중…',
        badgeFailed: '⛔ 검증 실패',
        aboutTitle: '정보 / 프라이버시 및 로컬 데이터',
        aboutToggle: 'ⓘ 정보',
        sasDialogTitle: '🛡️ 보안 코드 검증',
        sasDialogBodyLine1: '신뢰할 수 있는 채널(전화 / 직접 만남)로 아래 숫자를 서로 읽어 주세요.',
        sasDialogBodyLine2: '숫자가 일치할 때만 중간자 공격이 없는 것입니다 — 이것이 가장 중요한 단계입니다.',
        peerPrefix: '상대방: ',
        sasAgree: '✓ 일치함, 채팅 시작',
        sasDisagree: '✗ 다름, 연결 끊기',
        sasBarLabel: '🛡️ 보안 코드',
        sasVerifiedMark: '✓ 일치 확인됨',
        createRoomTitle: '엄격한 일대일 방을 만듭니다: 2명이 참여하면 링크를 가진 다른 사람은 서버에서 거부됩니다(방이 가득 참).',
        createRoomBtn: '🔗 방 만들기',
        oneToOneNote: '· 일대일 (2명 참여 후 잠김)',
        joinRoomBtn: '🔌 방 참여',
        roomCreatedHeading: '🔗 방이 생성되었습니다 — 상대방에게 링크를 보내세요. 브라우저에서 링크를 열면 자동으로 참여합니다',
        establishingEncrypted: '🔄 암호화 연결을 설정하는 중…',
        waitingPeerJoin: '● 상대방의 참여를 기다리는 중…',
        roomLinkWarning: '⚠️ 링크에는 일회용 방 토큰이 포함되어 있으니 신뢰할 수 있는 채널로 전송하세요. 연결한 후에는 채팅을 시작하기 전에 아래의 “보안 코드”를 전화 / 직접 만남으로 상대방과 확인하세요 — 이것이 중간자 공격(악의적인 시그널링 서버 포함)을 배제하는 핵심 단계입니다.',
        copyLink: '📋 링크 복사',
        collapse: '접기',
        aboutPrivacyTitle: '메시지는 종단 간 암호화되어 P2P로 전송됩니다. 서버는 페어링만 중계할 뿐 어떤 메시지도 처리하거나 저장하지 않습니다',
        aboutPrivacyBody: '🔒 서버는 채팅 기록을 저장하지 않습니다. 메시지는 종단 간 암호화되어 P2P로 전송됩니다. 채팅 기록은 이 기기의 브라우저에만 남으며(페이지를 닫으면 지워지고 업로드되지 않습니다).',
        clearDataTitle: '이 브라우저에 저장된 신원과 모든 로컬 데이터를 삭제하고 초기 상태로 돌아갑니다',
        clearDataBtn: '로컬 데이터 지우기',
        emptyConnected: '암호화 채널이 설정되었습니다 — 메시지를 보내 채팅을 시작하세요.',
        emptyDisconnected: '“🔗 방 만들기”를 클릭하여 상대방에게 보낼 링크를 생성하거나,\n상대방이 보낸 링크를 열어 종단 간 암호화 채팅을 시작하세요.',
        placeholderWaitingSecure: '보안 채널을 기다리는 중…',
        placeholderConfirmSas: '먼저 보안 코드를 검증하고 “일치함”을 클릭하세요…',
        joinRoomDialogTitle: '🔌 방 참여',
        pasteRoomLink: '상대방이 보낸 방 링크를 붙여넣으세요:',
        cancel: '취소',
        join: '참여',
        loadIdentityFailed: '로컬 신원을 읽지 못했습니다. 페이지를 새로 고친 후 다시 시도해 주세요.',
        identityIncomplete: '로컬 신원이 불완전하여 암호화 채널을 설정할 수 없습니다. 신원을 재설정한 후 다시 시도해 주세요.',
        secureChannelFailed: '암호화 채널 설정에 실패했습니다. 다시 시도해 주세요.',
        e2eEstablished: '🔐 종단 간 암호화 채널이 설정되었습니다. 채팅을 시작하기 전에 아래 보안 코드를 상대방과 검증하세요.',
        e2eEstablishing: '🔐 종단 간 암호화 채널을 설정하는 중…',
        peerVerifyFailed: '⛔ 상대방 신원 검증에 실패했습니다 — 중간자 공격이 있을 수 있습니다. 연결이 끊어졌습니다.',
        relayNotice: '🔒 릴레이 서버를 통해 상대방과 암호화하여 연결됩니다. 실제 IP는 상대방에게 노출되지 않습니다.',
        connectedEstablishing: '✅ 상대방과 연결되었습니다. 종단 간 암호화를 설정하는 중…',
        connectFailed: '연결에 실패했습니다. 다시 시도해 주세요.',
        peerDisconnected: '상대방과의 연결이 종료되었습니다.',
        peerJoinedConnecting: '상대방이 참여했습니다. 연결하는 중…',
        negotiationFailed: '연결 협상에 실패했습니다. 다시 시도해 주세요.',
        negotiationError: '연결 협상 중 오류가 발생했습니다. 다시 시도해 주세요.',
        peerLeft: '상대방이 나갔습니다. 이 세션이 종료되었습니다.',
        signalingError: '연결 서비스에 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        roomReadyWaiting: '방이 준비되었습니다. 상대방의 참여를 기다리는 중…',
        joinedConnecting: '방에 참여했습니다. 상대방과 연결하는 중…',
        serverConnectFailed: '서버에 연결할 수 없습니다. 네트워크를 확인하고 다시 시도해 주세요.',
        notSecureYet: '보안 채널이 준비되지 않아 메시지를 보낼 수 없습니다',
        verifySasFirst: '먼저 전화 / 직접 만남으로 상대방과 보안 코드를 검증하고 일치를 확인한 후 메시지를 보내세요',
        invalidRoomLink: '잘못된 방 링크입니다. https://…/#room=xxx&t=yyy 형식이어야 합니다',
        roomCodeBtn: '🔢 방 코드',
        roomCodeTitle: '약속한 방 코드로 연결합니다 (긴 링크를 보낼 필요 없음)',
        roomCodeDialogTitle: '방 코드로 연결',
        roomCodeDialogBody: '같은 방 코드를 약속하세요: 한 사람은 만들기를, 다른 사람은 참여를 누릅니다. 긴 방 링크를 보낼 필요가 없습니다.',
        roomCodePlaceholder: '약속한 방 코드를 입력하세요 (최소 8 chars)',
        roomCodeSecurityHint: '방 코드는 단지 만남을 위한 식별자일 뿐 추측될 수 있습니다. 중간자 공격 방어는 여전히 연결 후 보안 코드 / 페어링 코드를 검증하는 데서 나옵니다 — 반드시 검증하세요.',
        roomCodeCreateBtn: '방 만들기',
        roomCodeJoinBtn: '방 참여',
        roomCodeTooShort: '방 코드가 너무 짧습니다 (최소 8 chars)',
        roomCodeShareLabel: '상대방에게 이 방 코드를 알려주세요:',
        roomCodeShareHint: '상대방에게 “방 코드”를 열어 참여를 누르고 같은 코드를 입력하도록 하세요. 보안 / 페어링 코드 검증을 잊지 마세요.',
        disconnectedManual: '연결이 끊어졌습니다',
        copiedToClipboard: '클립보드에 복사되었습니다',
        relayNotReady: '릴레이 서버가 준비되지 않아 연결이 실패할 수 있습니다. 계속 연결되지 않으면 사이트 관리자에게 문의하세요.',
        sasMismatch: '보안 코드가 일치하지 않습니다 — 중간자 공격일 수 있습니다. 연결이 끊어졌습니다.',
        nicknameUpdated: '닉네임이 업데이트되었습니다',
        nicknameUpdateFailed: '닉네임 업데이트에 실패했습니다',
        sasConfirmedToast: '보안 코드가 일치하는 것으로 확인되었습니다 — 채팅을 시작할 수 있습니다',
        setNicknamePrompt: '닉네임을 설정하세요 (상대방에게 표시됨):',
        clearDataConfirm: '이 기기의 모든 로컬 데이터를 지우시겠습니까?\n\n이 작업은 암호화된 신원과 이 브라우저에 저장된 모든 로컬 데이터를 삭제하며 되돌릴 수 없습니다(어차피 서버에는 아무것도 저장되지 않습니다). 이후에는 “암호문구 설정” 화면으로 돌아가 처음부터 다시 시작합니다.',
        pairUseToggle: '페어링 코드 사용 (자동 검증, 수동 보안 코드 확인 불필요)',
        pairCodeLabel: '페어링 코드',
        pairShareHint: '⚠️ 페어링 코드는 위 링크와 다른 신뢰할 수 있는 채널(직접 만남 / 전화 / 다른 암호화 앱)로 상대방에게 공유하세요 — 위 링크와 같은 채널로 보내면 아무런 보호 효과가 없습니다.',
        pairEnterTitle: '🔑 페어링 코드 입력',
        pairEnterBody: '상대방이 페어링 코드 검증을 활성화했습니다. 신뢰할 수 있는 채널로 받은 코드를 입력하면 중간자 공격이 없음을 자동으로 확인합니다.',
        pairEnterPlaceholder: '예: ABCD-1234-EFGH-…',
        pairConfirmBtn: '확인',
        pairVerifyingBadge: '🔒 암호화됨 · 페어링 코드 검증 중',
        pairVerifiedBadge: '🔐 페어링 코드 검증됨',
        pairVerifiedMark: '✓ 페어링 코드 검증됨 (자동 중간자 공격 방어)',
        pairBarLabel: '페어링 코드:',
        pairFailed: '페어링 코드 불일치 또는 중간자 공격 — 연결이 끊어졌습니다',
        pairMissingCode: '먼저 전체 페어링 코드(시스템이 생성한 코드)를 입력하세요',
        pairTimedOut: '페어링 검증 시간이 초과되었습니다 — 연결이 끊어졌습니다 (양쪽이 같은 코드를 사용하는지 확인하세요)',
        pairJoinOptional: '페어링 코드 (선택 사항. 상대방이 활성화한 경우 입력하세요 — 자동 검증되며 수동 보안 코드 확인 불필요)',
        blobShareBtn: '📤 파일 공유 (링크)',
        blobShareTitle: '파일을 암호화하여 업로드하고 공유 링크를 받습니다 (수신자가 온라인일 필요 없음 — 링크로 다운로드)',
        blobUploading: '암호화 및 업로드 중…',
        blobPasswordPrompt: '선택 사항: 다운로드 비밀번호를 설정하세요 (비워 두면 링크만으로 충분). 설정하면 수신자는 링크 + 비밀번호가 필요합니다.',
        blobReady: '✅ 공유 링크가 생성되었습니다 (파일 암호화 및 업로드 완료)',
        blobFailed: '파일 업로드에 실패했습니다',
        blobTooLarge: '파일이 너무 큽니다: 호스팅 버전의 단일 업로드는 ~95MB로 제한됩니다 (Cloudflare 100MB 요청 본문 제한). 더 큰 파일은 멀티파트 업로드가 필요합니다 (아직 지원되지 않음).',
        blobLinkHeading: '📦 파일 공유 링크 (복호화 키 포함 — 신뢰할 수 있는 채널로 전송하세요)',
        blobLinkHint: '⚠️ 링크에는 복호화 키가 포함되어 있어 수신자는 온라인이 아니어도 다운로드 및 복호화할 수 있습니다. 기본적으로 24h 후에 만료됩니다.',
        file: {
          attachTitle: '파일 또는 사진 보내기',
          busy: '이미 파일을 전송 중입니다 — 끝날 때까지 기다린 후 다른 파일을 보내세요',
          tooLarge: '파일이 100 MB 제한을 초과합니다',
          readFailed: '파일을 읽지 못했습니다',
          offerFailed: '파일 전송에 실패했습니다',
          sending: '전송 중',
          receiving: '수신 중',
          completed: '완료됨',
          failed: '전송 실패',
          cancelled: '취소됨',
          verifyFailed: '파일 검증에 실패했습니다 (크기 또는 해시 불일치). 폐기되었습니다',
          incoming: '파일을 수신하는 중…',
          sent: '전송됨',
          received: '수신됨',
          download: '다운로드',
          cancel: '취소',
          imageAlt: '수신한 이미지'
        }
      }
    }
  },
  'fr': {
    appTitle: 'VeilConnect',
    appSubtitle: 'Messagerie chiffrée P2P',
    appDescription: 'Une application de messagerie chiffrée de bout en bout en P2P qui garantit la confidentialité et la sécurité de vos communications sans dépendre de serveurs centraux.',

    welcome: {
      title: 'VeilConnect',
      subtitle: 'Messagerie chiffrée P2P',
      description: 'Bienvenue sur VeilConnect ! Il s’agit d’une application de messagerie chiffrée de bout en bout en P2P qui garantit la confidentialité et la sécurité de vos communications sans dépendre de serveurs centraux.',
      features: {
        title: '🔐 Fonctionnalités clés',
        encryption: '• Chiffrement de bout en bout (XSalsa20-Poly1305)',
        p2p: '• Communication directe P2P (WebRTC)',
        customId: '• Identifiant utilisateur personnalisé',
        fileTransfer: '• Prise en charge du transfert de fichiers',
        decentralized: '• Entièrement décentralisé'
      },
      startButton: 'Commencer'
    },

    identity: {
      generateButton: 'Générer une nouvelle identité',
      clearButton: 'Effacer l’identité',
      status: {
        active: '✅ Identité active',
        inactive: 'ℹ️ Veuillez d’abord générer une identité',
        pleaseGenerate: 'Veuillez d’abord générer une identité'
      },
      userId: 'Identifiant utilisateur :',
      nickname: 'Pseudonyme :',
      publicKey: 'Clé publique :',
      privateKey: 'Clé privée :'
    },

    encryption: {
      title: '🔐 Test de chiffrement',
      inputPlaceholder: 'Saisissez le texte à chiffrer',
      testButton: 'Tester le chiffrement',
      original: 'Original :',
      encrypted: 'Chiffré :',
      decrypted: 'Déchiffré :',
      success: '✅ Test de chiffrement réussi',
      error: 'Échec du test de chiffrement',
      pleaseGenerateIdentity: 'Veuillez d’abord générer une identité',
      pleaseEnterText: 'Veuillez saisir le texte à chiffrer'
    },

    system: {
      title: '📊 État du système',
      identityStatus: 'État de l’identité :',
      messageCount: 'Nombre de messages :',
      contactCount: 'Nombre de contacts :',
      uptime: 'Durée de fonctionnement :',
      seconds: 'secondes'
    },

    features: {
      title: '🚀 Démonstration des fonctionnalités clés',
      encryptionDemo: {
        title: '🔐 Chiffrement de bout en bout',
        description: 'Sécurisez vos messages avec l’algorithme XSalsa20-Poly1305',
        button: 'Démo du chiffrement'
      },
      identityDemo: {
        title: '🆔 Identité utilisateur',
        description: 'Identité unique basée sur une clé publique Ed25519',
        button: 'Démo de l’identité'
      },
      storageDemo: {
        title: '💾 Stockage local',
        description: 'Stockage local chiffré pour les messages et les contacts',
        button: 'Démo du stockage'
      },
      p2pDemo: {
        title: '🌐 Connexion P2P',
        description: 'Communication directe WebRTC (nécessite deux clients)',
        button: 'Démo P2P'
      }
    },

    log: {
      title: '📝 Journal système',
      clearButton: 'Effacer le journal',
      cleared: 'Journal effacé'
    },

    settings: {
      title: '⚙️ Paramètres',
      language: 'Langue',
      theme: 'Thème',
      notifications: 'Notifications'
    },

    common: {
      save: 'Enregistrer',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      delete: 'Supprimer',
      edit: 'Modifier',
      close: 'Fermer',
      back: 'Retour',
      next: 'Suivant',
      loading: 'Chargement…',
      error: 'Erreur',
      success: 'Succès',
      warning: 'Avertissement',
      info: 'Info'
    },

    completion: {
      title: 'Identité créée avec succès !',
      description: '🎉 Félicitations ! Vous avez créé votre identité VeilConnect avec succès. Vous pouvez désormais établir des connexions P2P sécurisées avec d’autres utilisateurs.',
      idType: 'Type d’identifiant :',
      restartButton: 'Réinitialiser',
      chatButton: 'Démarrer la discussion',
      chatComingSoon: 'La fonction de discussion est en cours de développement…'
    },

    chat: {
      needIdentity: 'Identité requise',
      generateFirst: 'Veuillez d’abord générer une identité pour commencer à discuter',
      notConnected: 'Non connecté',
      connecting: 'Connexion en cours',
      connected: 'Connexion P2P établie',
      disconnected: 'Connexion P2P perdue',
      encrypted: 'Communication chiffrée',
      offline: 'Hors ligne',
      createConnection: 'Créer',
      joinConnection: 'Rejoindre',
      disconnect: 'Se déconnecter',
      connect: 'Se connecter',
      typePlaceholder: 'Saisissez un message…',
      connectToSend: 'Connectez-vous à un pair pour envoyer des messages',
      shareConnection: 'Partager la connexion',
      shareInstructions: 'Partagez cet identifiant de connexion avec votre ami :',
      joinInstructions: 'Saisissez l’identifiant de connexion fourni par votre ami :',
      connectionIdPlaceholder: 'Collez l’identifiant de connexion ici',
      waitingConnection: 'En attente de la connexion du pair',
      connectionFailed: 'Échec de la création de la connexion',
      joinFailed: 'Échec de la connexion à la session',
      sendFailed: 'Échec de l’envoi du message',
      idCopied: 'Identifiant de connexion copié dans le presse-papiers',
      send: 'Envoyer',
      p2p: {
        headerTitle: '💬 Discussion sécurisée P2P',
        editNicknameTitle: 'Cliquez pour changer votre pseudonyme (visible par votre pair)',
        mePrefix: 'Moi : ',
        unnamed: 'Sans nom',
        badgeVerifiedTitle: 'Les messages sont chiffrés de bout en bout et vous avez vérifié le code de sécurité par un canal externe — aucun intermédiaire',
        badgeVerified: '🔒 Chiffré · Vérifié',
        badgeEncryptedTitle: 'Les messages sont chiffrés de bout en bout, mais le code de sécurité n’a pas été vérifié par un canal externe, on ne peut donc pas exclure un intermédiaire',
        badgePendingSas: '🔒 Chiffré · Vérifiez le code de sécurité',
        badgeHandshaking: '🔄 Sécurisation de la connexion…',
        badgeFailed: '⛔ Échec de la vérification',
        aboutTitle: 'À propos / Confidentialité et données locales',
        aboutToggle: 'ⓘ À propos',
        sasDialogTitle: '🛡️ Vérifier le code de sécurité',
        sasDialogBodyLine1: 'Lisez-vous mutuellement les chiffres ci-dessous via un canal de confiance (téléphone / en personne).',
        sasDialogBodyLine2: 'Ce n’est que s’ils correspondent qu’il n’y a aucun intermédiaire — c’est l’étape la plus importante.',
        peerPrefix: 'Pair : ',
        sasAgree: '✓ Ils correspondent, commencer à discuter',
        sasDisagree: '✗ Ils diffèrent, se déconnecter',
        sasBarLabel: '🛡️ Code de sécurité',
        sasVerifiedMark: '✓ Correspondance vérifiée',
        createRoomTitle: 'Créez un salon strictement individuel : une fois 2 personnes connectées, toute autre personne disposant du lien est rejetée par le serveur (Salon plein).',
        createRoomBtn: '🔗 Créer un salon',
        oneToOneNote: '· Individuel (se verrouille après 2 connexions)',
        joinRoomBtn: '🔌 Rejoindre un salon',
        roomCreatedHeading: '🔗 Salon créé — envoyez le lien à votre pair ; la connexion est automatique lorsqu’il l’ouvre dans un navigateur',
        establishingEncrypted: '🔄 Établissement de la connexion chiffrée…',
        waitingPeerJoin: '● En attente de la connexion du pair…',
        roomLinkWarning: '⚠️ Le lien contient un jeton de salon à usage unique ; envoyez-le via un canal de confiance. Après la connexion, vérifiez le « code de sécurité » ci-dessous avec votre pair par téléphone / en personne avant de discuter — c’est l’étape clé pour exclure tout intermédiaire (y compris un serveur de signalisation malveillant).',
        copyLink: '📋 Copier le lien',
        collapse: 'Réduire',
        aboutPrivacyTitle: 'Les messages sont chiffrés de bout en bout et envoyés de pair à pair ; le serveur ne fait que relayer l’appairage et ne traite ni ne stocke jamais aucun message',
        aboutPrivacyBody: '🔒 Le serveur ne stocke aucun historique de discussion ; les messages sont chiffrés de bout en bout et envoyés de pair à pair. L’historique de discussion ne réside que dans le navigateur de cet appareil (effacé à la fermeture de la page, jamais téléversé).',
        clearDataTitle: 'Supprimer l’identité et toutes les données locales enregistrées dans ce navigateur, et revenir à l’état initial',
        clearDataBtn: 'Effacer les données locales',
        emptyConnected: 'Canal chiffré établi — envoyez un message pour commencer à discuter.',
        emptyDisconnected: 'Cliquez sur « 🔗 Créer un salon » pour générer un lien destiné à votre pair,\nou ouvrez un lien qu’il vous a envoyé, pour démarrer une discussion chiffrée de bout en bout.',
        placeholderWaitingSecure: 'En attente du canal sécurisé…',
        placeholderConfirmSas: 'Vérifiez d’abord le code de sécurité et cliquez sur « Ils correspondent »…',
        joinRoomDialogTitle: '🔌 Rejoindre un salon',
        pasteRoomLink: 'Collez le lien du salon que votre pair vous a envoyé :',
        cancel: 'Annuler',
        join: 'Rejoindre',
        loadIdentityFailed: 'Échec de la lecture de l’identité locale. Veuillez actualiser la page et réessayer.',
        identityIncomplete: 'L’identité locale est incomplète ; impossible d’établir un canal chiffré. Veuillez réinitialiser votre identité et réessayer.',
        secureChannelFailed: 'Échec de l’établissement du canal chiffré. Veuillez réessayer.',
        e2eEstablished: '🔐 Canal chiffré de bout en bout établi. Vérifiez le code de sécurité ci-dessous avec votre pair avant de discuter.',
        e2eEstablishing: '🔐 Établissement du canal chiffré de bout en bout…',
        peerVerifyFailed: '⛔ Échec de la vérification de l’identité du pair — un intermédiaire est peut-être présent. Déconnecté.',
        relayNotice: '🔒 Vous vous connecterez à votre pair de façon chiffrée via un serveur relais ; votre véritable IP ne lui est pas exposée.',
        connectedEstablishing: '✅ Connecté au pair, établissement du chiffrement de bout en bout…',
        connectFailed: 'Échec de la connexion. Veuillez réessayer.',
        peerDisconnected: 'La connexion à votre pair a été fermée.',
        peerJoinedConnecting: 'Le pair a rejoint le salon, connexion en cours…',
        negotiationFailed: 'Échec de la négociation de la connexion. Veuillez réessayer.',
        negotiationError: 'Erreur de négociation de la connexion. Veuillez réessayer.',
        peerLeft: 'Votre pair est parti ; cette session est terminée.',
        signalingError: 'Le service de connexion a rencontré une erreur. Veuillez réessayer plus tard.',
        roomReadyWaiting: 'Salon prêt, en attente de la connexion du pair…',
        joinedConnecting: 'Salon rejoint, connexion au pair en cours…',
        serverConnectFailed: 'Impossible de se connecter au serveur. Vérifiez votre réseau et réessayez.',
        notSecureYet: 'Le canal sécurisé n’est pas prêt ; impossible d’envoyer des messages',
        verifySasFirst: 'Vérifiez d’abord le code de sécurité avec votre pair par téléphone / en personne et confirmez qu’il correspond, puis envoyez des messages',
        invalidRoomLink: 'Lien de salon invalide. Il devrait ressembler à https://…/#room=xxx&t=yyy',
        roomCodeBtn: '🔢 Code de salon',
        roomCodeTitle: 'Connectez-vous avec un code de salon convenu (aucun long lien à envoyer)',
        roomCodeDialogTitle: 'Se connecter par code de salon',
        roomCodeDialogBody: 'Convenez du même code de salon : une personne appuie sur Créer, l’autre sur Rejoindre. Inutile d’envoyer le long lien du salon.',
        roomCodePlaceholder: 'Saisissez le code de salon convenu (8 chars min.)',
        roomCodeSecurityHint: 'Un code de salon n’est qu’une étiquette de rendez-vous et peut être deviné ; la protection contre les intermédiaires provient toujours de la vérification du code de sécurité / code d’appairage après la connexion — n’oubliez pas de vérifier.',
        roomCodeCreateBtn: 'Créer un salon',
        roomCodeJoinBtn: 'Rejoindre un salon',
        roomCodeTooShort: 'Code de salon trop court (8 chars min.)',
        roomCodeShareLabel: 'Communiquez ce code de salon à votre pair :',
        roomCodeShareHint: 'Demandez-lui d’ouvrir « Code de salon », d’appuyer sur Rejoindre et de saisir le même code. Pensez à vérifier le code de sécurité / d’appairage.',
        disconnectedManual: 'Déconnecté',
        copiedToClipboard: 'Copié dans le presse-papiers',
        relayNotReady: 'Le serveur relais n’est pas prêt et la connexion peut échouer. S’il reste injoignable, contactez l’administrateur du site.',
        sasMismatch: 'Le code de sécurité ne correspond pas — intermédiaire possible. Déconnecté.',
        nicknameUpdated: 'Pseudonyme mis à jour',
        nicknameUpdateFailed: 'Échec de la mise à jour du pseudonyme',
        sasConfirmedToast: 'Code de sécurité confirmé comme correspondant — vous pouvez commencer à discuter',
        setNicknamePrompt: 'Définissez votre pseudonyme (visible par votre pair) :',
        clearDataConfirm: 'Effacer toutes les données locales sur cet appareil ?\n\nCela supprime l’identité chiffrée et toutes les données locales enregistrées dans ce navigateur, et ne peut pas être annulé (le serveur ne stocke rien de toute façon). Ensuite, vous reviendrez à « Définir la phrase secrète » et recommencerez.',
        pairUseToggle: 'Utiliser un code d’appairage (vérification automatique, sans contrôle manuel du code de sécurité)',
        pairCodeLabel: 'Code d’appairage',
        pairShareHint: '⚠️ Partagez le code d’appairage avec votre pair via un canal de confiance DIFFÉRENT (en personne / téléphone / une autre application chiffrée) — jamais par le même canal que le lien ci-dessus, sinon il n’offre aucune protection.',
        pairEnterTitle: '🔑 Saisir le code d’appairage',
        pairEnterBody: 'Votre pair a activé la vérification par code d’appairage. Saisissez le code qu’il vous a fourni via un canal de confiance pour confirmer automatiquement l’absence d’intermédiaire.',
        pairEnterPlaceholder: 'ex. ABCD-1234-EFGH-…',
        pairConfirmBtn: 'Confirmer',
        pairVerifyingBadge: '🔒 Chiffré · vérification du code d’appairage',
        pairVerifiedBadge: '🔐 Code d’appairage vérifié',
        pairVerifiedMark: '✓ Code d’appairage vérifié (anti-intermédiaire automatique)',
        pairBarLabel: 'Code d’appairage :',
        pairFailed: 'Code d’appairage non concordant ou intermédiaire — déconnecté',
        pairMissingCode: 'Saisissez d’abord le code d’appairage complet (celui généré par le système)',
        pairTimedOut: 'La vérification de l’appairage a expiré — déconnecté (vérifiez que les deux parties utilisent le même code)',
        pairJoinOptional: 'Code d’appairage (facultatif ; renseignez-le si votre pair l’a activé — vérification automatique, sans contrôle manuel du code de sécurité)',
        blobShareBtn: '📤 Partager un fichier (lien)',
        blobShareTitle: 'Chiffrez et téléversez un fichier, obtenez un lien de partage (le destinataire n’a pas besoin d’être en ligne — il télécharge via le lien)',
        blobUploading: 'Chiffrement et téléversement…',
        blobPasswordPrompt: 'Facultatif : définissez un mot de passe de téléchargement (vide = le lien seul suffit). S’il est défini, le destinataire a besoin du lien + du mot de passe.',
        blobReady: '✅ Lien de partage créé (fichier chiffré et téléversé)',
        blobFailed: 'Échec du téléversement du fichier',
        blobTooLarge: 'Fichier trop volumineux : le téléversement unique hébergé est plafonné à ~95MB (limite de corps de requête Cloudflare de 100MB). Les fichiers plus volumineux nécessitent un téléversement en plusieurs parties (pas encore pris en charge).',
        blobLinkHeading: '📦 Lien de partage de fichier (contient la clé de déchiffrement — envoyez-le via un canal de confiance)',
        blobLinkHint: '⚠️ Le lien contient la clé de déchiffrement ; le destinataire peut télécharger et déchiffrer sans être en ligne. Expire dans 24h par défaut.',
        file: {
          attachTitle: 'Envoyer un fichier ou une photo',
          busy: 'Un fichier est déjà en cours d’envoi — attendez la fin avant d’en envoyer un autre',
          tooLarge: 'Le fichier dépasse la limite de 100 MB',
          readFailed: 'Échec de la lecture du fichier',
          offerFailed: 'Échec de l’envoi du fichier',
          sending: 'Envoi en cours',
          receiving: 'Réception en cours',
          completed: 'Terminé',
          failed: 'Échec du transfert',
          cancelled: 'Annulé',
          verifyFailed: 'Échec de la vérification du fichier (taille ou empreinte non concordante) ; ignoré',
          incoming: 'Réception d’un fichier…',
          sent: 'Envoyé',
          received: 'Reçu',
          download: 'Télécharger',
          cancel: 'Annuler',
          imageAlt: 'Image reçue'
        }
      }
    }
  },
  'de': {
    appTitle: 'VeilConnect',
    appSubtitle: 'P2P-verschlüsselter Chat',
    appDescription: 'Eine P2P-Ende-zu-Ende-verschlüsselte Chat-Anwendung, die die Privatsphäre und Sicherheit Ihrer Kommunikation gewährleistet, ohne auf zentrale Server angewiesen zu sein.',

    welcome: {
      title: 'VeilConnect',
      subtitle: 'P2P-verschlüsselter Chat',
      description: 'Willkommen bei VeilConnect! Dies ist eine P2P-Ende-zu-Ende-verschlüsselte Chat-Anwendung, die die Privatsphäre und Sicherheit Ihrer Kommunikation gewährleistet, ohne auf zentrale Server angewiesen zu sein.',
      features: {
        title: '🔐 Kernfunktionen',
        encryption: '• Ende-zu-Ende-Verschlüsselung (XSalsa20-Poly1305)',
        p2p: '• P2P-Direktkommunikation (WebRTC)',
        customId: '• Benutzerdefinierte Benutzer-ID',
        fileTransfer: '• Unterstützung für Dateiübertragung',
        decentralized: '• Vollständig dezentralisiert'
      },
      startButton: 'Loslegen'
    },

    identity: {
      generateButton: 'Neue Identität erstellen',
      clearButton: 'Identität löschen',
      status: {
        active: '✅ Identität aktiv',
        inactive: 'ℹ️ Bitte erstellen Sie zuerst eine Identität',
        pleaseGenerate: 'Bitte erstellen Sie zuerst eine Identität'
      },
      userId: 'Benutzer-ID:',
      nickname: 'Spitzname:',
      publicKey: 'Öffentlicher Schlüssel:',
      privateKey: 'Privater Schlüssel:'
    },

    encryption: {
      title: '🔐 Verschlüsselungstest',
      inputPlaceholder: 'Zu verschlüsselnden Text eingeben',
      testButton: 'Verschlüsselung testen',
      original: 'Original:',
      encrypted: 'Verschlüsselt:',
      decrypted: 'Entschlüsselt:',
      success: '✅ Verschlüsselungstest erfolgreich',
      error: 'Verschlüsselungstest fehlgeschlagen',
      pleaseGenerateIdentity: 'Bitte erstellen Sie zuerst eine Identität',
      pleaseEnterText: 'Bitte geben Sie den zu verschlüsselnden Text ein'
    },

    system: {
      title: '📊 Systemstatus',
      identityStatus: 'Identitätsstatus:',
      messageCount: 'Anzahl der Nachrichten:',
      contactCount: 'Anzahl der Kontakte:',
      uptime: 'Betriebszeit:',
      seconds: 'Sekunden'
    },

    features: {
      title: '🚀 Demo der Kernfunktionen',
      encryptionDemo: {
        title: '🔐 Ende-zu-Ende-Verschlüsselung',
        description: 'Sichere Nachrichten mit dem XSalsa20-Poly1305-Algorithmus',
        button: 'Verschlüsselung demonstrieren'
      },
      identityDemo: {
        title: '🆔 Benutzeridentität',
        description: 'Eindeutige Identität auf Basis des Ed25519-Öffentlichen-Schlüssels',
        button: 'Identität demonstrieren'
      },
      storageDemo: {
        title: '💾 Lokaler Speicher',
        description: 'Lokale verschlüsselte Speicherung von Nachrichten und Kontakten',
        button: 'Speicher demonstrieren'
      },
      p2pDemo: {
        title: '🌐 P2P-Verbindung',
        description: 'WebRTC-Direktkommunikation (erfordert zwei Clients)',
        button: 'P2P demonstrieren'
      }
    },

    log: {
      title: '📝 Systemprotokoll',
      clearButton: 'Protokoll löschen',
      cleared: 'Protokoll gelöscht'
    },

    settings: {
      title: '⚙️ Einstellungen',
      language: 'Sprache',
      theme: 'Design',
      notifications: 'Benachrichtigungen'
    },

    common: {
      save: 'Speichern',
      cancel: 'Abbrechen',
      confirm: 'Bestätigen',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      close: 'Schließen',
      back: 'Zurück',
      next: 'Weiter',
      loading: 'Wird geladen…',
      error: 'Fehler',
      success: 'Erfolg',
      warning: 'Warnung',
      info: 'Info'
    },

    completion: {
      title: 'Identität erfolgreich erstellt!',
      description: '🎉 Herzlichen Glückwunsch! Sie haben Ihre VeilConnect-Identität erfolgreich erstellt. Sie können nun sichere P2P-Verbindungen mit anderen Benutzern herstellen.',
      idType: 'ID-Typ:',
      restartButton: 'Zurücksetzen',
      chatButton: 'Chat starten',
      chatComingSoon: 'Die Chat-Funktion befindet sich in Entwicklung…'
    },

    chat: {
      needIdentity: 'Identität erforderlich',
      generateFirst: 'Bitte erstellen Sie zuerst eine Identität, um mit dem Chatten zu beginnen',
      notConnected: 'Nicht verbunden',
      connecting: 'Verbindung wird hergestellt',
      connected: 'P2P-Verbindung hergestellt',
      disconnected: 'P2P-Verbindung verloren',
      encrypted: 'Verschlüsselte Kommunikation',
      offline: 'Offline',
      createConnection: 'Erstellen',
      joinConnection: 'Beitreten',
      disconnect: 'Trennen',
      connect: 'Verbinden',
      typePlaceholder: 'Nachricht eingeben…',
      connectToSend: 'Verbinden Sie sich mit einem Peer, um Nachrichten zu senden',
      shareConnection: 'Verbindung teilen',
      shareInstructions: 'Teilen Sie diese Verbindungs-ID mit Ihrem Freund:',
      joinInstructions: 'Geben Sie die Verbindungs-ID Ihres Freundes ein:',
      connectionIdPlaceholder: 'Verbindungs-ID hier einfügen',
      waitingConnection: 'Warten auf Verbindung des Peers',
      connectionFailed: 'Verbindung konnte nicht erstellt werden',
      joinFailed: 'Beitritt zur Verbindung fehlgeschlagen',
      sendFailed: 'Nachricht konnte nicht gesendet werden',
      idCopied: 'Verbindungs-ID in die Zwischenablage kopiert',
      send: 'Senden',
      p2p: {
        headerTitle: '💬 Sicherer P2P-Chat',
        editNicknameTitle: 'Klicken, um Ihren Spitznamen zu ändern (für Ihren Peer sichtbar)',
        mePrefix: 'Ich: ',
        unnamed: 'Unbenannt',
        badgeVerifiedTitle: 'Nachrichten sind Ende-zu-Ende-verschlüsselt, und Sie haben den Sicherheitscode außerhalb des Kanals verifiziert — kein Man-in-the-Middle',
        badgeVerified: '🔒 Verschlüsselt · Verifiziert',
        badgeEncryptedTitle: 'Nachrichten sind Ende-zu-Ende-verschlüsselt, aber der Sicherheitscode wurde nicht außerhalb des Kanals verifiziert, sodass ein Man-in-the-Middle nicht ausgeschlossen werden kann',
        badgePendingSas: '🔒 Verschlüsselt · Sicherheitscode verifizieren',
        badgeHandshaking: '🔄 Verbindung wird abgesichert…',
        badgeFailed: '⛔ Verifizierung fehlgeschlagen',
        aboutTitle: 'Über / Datenschutz & lokale Daten',
        aboutToggle: 'ⓘ Über',
        sasDialogTitle: '🛡️ Sicherheitscode verifizieren',
        sasDialogBodyLine1: 'Lesen Sie sich die untenstehenden Ziffern über einen vertrauenswürdigen Kanal (Telefon / persönlich) gegenseitig vor.',
        sasDialogBodyLine2: 'Nur wenn sie übereinstimmen, gibt es keinen Man-in-the-Middle — dies ist der wichtigste Schritt.',
        peerPrefix: 'Peer: ',
        sasAgree: '✓ Sie stimmen überein, Chat starten',
        sasDisagree: '✗ Sie unterscheiden sich, Verbindung trennen',
        sasBarLabel: '🛡️ Sicherheitscode',
        sasVerifiedMark: '✓ Übereinstimmung verifiziert',
        createRoomTitle: 'Erstellen Sie einen strengen Eins-zu-eins-Raum: Sobald 2 Personen beigetreten sind, wird jede weitere Person mit dem Link vom Server abgewiesen (Raum voll).',
        createRoomBtn: '🔗 Raum erstellen',
        oneToOneNote: '· Eins-zu-eins (gesperrt nach 2 Beitritten)',
        joinRoomBtn: '🔌 Raum beitreten',
        roomCreatedHeading: '🔗 Raum erstellt — senden Sie den Link an Ihren Peer; er tritt automatisch bei, wenn er ihn in einem Browser öffnet',
        establishingEncrypted: '🔄 Verschlüsselte Verbindung wird hergestellt…',
        waitingPeerJoin: '● Warten auf Beitritt des Peers…',
        roomLinkWarning: '⚠️ Der Link enthält ein einmaliges Raum-Token; senden Sie ihn über einen vertrauenswürdigen Kanal. Verifizieren Sie nach dem Verbinden den untenstehenden „Sicherheitscode“ mit Ihrem Peer per Telefon / persönlich, bevor Sie chatten — dies ist der entscheidende Schritt, um einen Man-in-the-Middle (einschließlich eines bösartigen Signaling-Servers) auszuschließen.',
        copyLink: '📋 Link kopieren',
        collapse: 'Einklappen',
        aboutPrivacyTitle: 'Nachrichten sind Ende-zu-Ende-verschlüsselt und werden Peer-to-Peer gesendet; der Server leitet nur die Kopplung weiter und verarbeitet oder speichert niemals Nachrichten',
        aboutPrivacyBody: '🔒 Der Server speichert keinen Chat-Verlauf; Nachrichten sind Ende-zu-Ende-verschlüsselt und werden Peer-to-Peer gesendet. Der Chat-Verlauf existiert nur im Browser dieses Geräts (wird beim Schließen der Seite gelöscht, niemals hochgeladen).',
        clearDataTitle: 'Löschen Sie die Identität und alle in diesem Browser gespeicherten lokalen Daten und kehren Sie zum Ausgangszustand zurück',
        clearDataBtn: 'Lokale Daten löschen',
        emptyConnected: 'Verschlüsselter Kanal hergestellt — senden Sie eine Nachricht, um mit dem Chatten zu beginnen.',
        emptyDisconnected: 'Klicken Sie auf „🔗 Raum erstellen“, um einen Link für Ihren Peer zu generieren,\noder öffnen Sie einen Link, den er Ihnen gesendet hat, um einen Ende-zu-Ende-verschlüsselten Chat zu starten.',
        placeholderWaitingSecure: 'Warten auf den sicheren Kanal…',
        placeholderConfirmSas: 'Verifizieren Sie zuerst den Sicherheitscode und klicken Sie auf „Sie stimmen überein“…',
        joinRoomDialogTitle: '🔌 Raum beitreten',
        pasteRoomLink: 'Fügen Sie den Raum-Link ein, den Ihr Peer Ihnen gesendet hat:',
        cancel: 'Abbrechen',
        join: 'Beitreten',
        loadIdentityFailed: 'Die lokale Identität konnte nicht gelesen werden. Bitte aktualisieren Sie die Seite und versuchen Sie es erneut.',
        identityIncomplete: 'Die lokale Identität ist unvollständig; ein verschlüsselter Kanal kann nicht hergestellt werden. Bitte setzen Sie Ihre Identität zurück und versuchen Sie es erneut.',
        secureChannelFailed: 'Der verschlüsselte Kanal konnte nicht hergestellt werden. Bitte versuchen Sie es erneut.',
        e2eEstablished: '🔐 Ende-zu-Ende-verschlüsselter Kanal hergestellt. Verifizieren Sie den untenstehenden Sicherheitscode mit Ihrem Peer, bevor Sie chatten.',
        e2eEstablishing: '🔐 Ende-zu-Ende-verschlüsselter Kanal wird hergestellt…',
        peerVerifyFailed: '⛔ Verifizierung der Peer-Identität fehlgeschlagen — möglicherweise liegt ein Man-in-the-Middle vor. Verbindung getrennt.',
        relayNotice: '🔒 Sie werden verschlüsselt über einen Relay-Server mit Ihrem Peer verbunden; Ihre echte IP wird ihm nicht offengelegt.',
        connectedEstablishing: '✅ Mit Peer verbunden, Ende-zu-Ende-Verschlüsselung wird hergestellt…',
        connectFailed: 'Verbindung fehlgeschlagen. Bitte versuchen Sie es erneut.',
        peerDisconnected: 'Die Verbindung zu Ihrem Peer wurde geschlossen.',
        peerJoinedConnecting: 'Peer beigetreten, Verbindung wird hergestellt…',
        negotiationFailed: 'Verbindungsaushandlung fehlgeschlagen. Bitte versuchen Sie es erneut.',
        negotiationError: 'Fehler bei der Verbindungsaushandlung. Bitte versuchen Sie es erneut.',
        peerLeft: 'Ihr Peer hat den Raum verlassen; diese Sitzung wurde beendet.',
        signalingError: 'Beim Verbindungsdienst ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.',
        roomReadyWaiting: 'Raum bereit, Warten auf Beitritt des Peers…',
        joinedConnecting: 'Dem Raum beigetreten, Verbindung zum Peer wird hergestellt…',
        serverConnectFailed: 'Verbindung zum Server nicht möglich. Überprüfen Sie Ihr Netzwerk und versuchen Sie es erneut.',
        notSecureYet: 'Der sichere Kanal ist nicht bereit; Nachrichten können nicht gesendet werden',
        verifySasFirst: 'Verifizieren Sie zuerst den Sicherheitscode mit Ihrem Peer per Telefon / persönlich und bestätigen Sie die Übereinstimmung, bevor Sie Nachrichten senden',
        invalidRoomLink: 'Ungültiger Raum-Link. Er sollte wie folgt aussehen: https://…/#room=xxx&t=yyy',
        roomCodeBtn: '🔢 Raumcode',
        roomCodeTitle: 'Verbinden Sie sich mit einem vereinbarten Raumcode (kein langer Link zu senden)',
        roomCodeDialogTitle: 'Per Raumcode verbinden',
        roomCodeDialogBody: 'Vereinbaren Sie denselben Raumcode: Eine Person tippt auf Erstellen, die andere auf Beitreten. Es ist nicht nötig, den langen Raum-Link zu senden.',
        roomCodePlaceholder: 'Vereinbarten Raumcode eingeben (mind. 8 chars)',
        roomCodeSecurityHint: 'Ein Raumcode ist nur eine Rendezvous-Kennung und kann erraten werden; der Schutz vor MITM kommt weiterhin aus der Verifizierung des Sicherheitscodes / Kopplungscodes nach dem Verbinden — stellen Sie sicher, dass Sie verifizieren.',
        roomCodeCreateBtn: 'Raum erstellen',
        roomCodeJoinBtn: 'Raum beitreten',
        roomCodeTooShort: 'Raumcode zu kurz (mind. 8 chars)',
        roomCodeShareLabel: 'Teilen Sie Ihrem Peer diesen Raumcode mit:',
        roomCodeShareHint: 'Lassen Sie ihn „Raumcode“ öffnen, auf Beitreten tippen und denselben Code eingeben. Denken Sie daran, den Sicherheits-/Kopplungscode zu verifizieren.',
        disconnectedManual: 'Verbindung getrennt',
        copiedToClipboard: 'In die Zwischenablage kopiert',
        relayNotReady: 'Der Relay-Server ist nicht bereit und die Verbindung kann fehlschlagen. Wenn er unerreichbar bleibt, wenden Sie sich an den Website-Administrator.',
        sasMismatch: 'Sicherheitscode stimmt nicht überein — möglicher Man-in-the-Middle. Verbindung getrennt.',
        nicknameUpdated: 'Spitzname aktualisiert',
        nicknameUpdateFailed: 'Spitzname konnte nicht aktualisiert werden',
        sasConfirmedToast: 'Sicherheitscode als übereinstimmend bestätigt — Sie können mit dem Chatten beginnen',
        setNicknamePrompt: 'Legen Sie Ihren Spitznamen fest (für Ihren Peer sichtbar):',
        clearDataConfirm: 'Alle lokalen Daten auf diesem Gerät löschen?\n\nDies löscht die verschlüsselte Identität und alle in diesem Browser gespeicherten lokalen Daten und kann nicht rückgängig gemacht werden (der Server speichert ohnehin nichts). Danach kehren Sie zu „Passphrase festlegen“ zurück und beginnen von vorne.',
        pairUseToggle: 'Einen Kopplungscode verwenden (automatische Verifizierung, keine manuelle Sicherheitscode-Prüfung)',
        pairCodeLabel: 'Kopplungscode',
        pairShareHint: '⚠️ Teilen Sie den Kopplungscode mit Ihrem Peer über einen ANDEREN vertrauenswürdigen Kanal (persönlich / Telefon / eine andere verschlüsselte App) — niemals über denselben Kanal wie den obigen Link, sonst bietet er keinen Schutz.',
        pairEnterTitle: '🔑 Kopplungscode eingeben',
        pairEnterBody: 'Ihr Peer hat die Verifizierung per Kopplungscode aktiviert. Geben Sie den Code ein, den er Ihnen über einen vertrauenswürdigen Kanal gegeben hat, um automatisch zu bestätigen, dass kein Man-in-the-Middle vorliegt.',
        pairEnterPlaceholder: 'z. B. ABCD-1234-EFGH-…',
        pairConfirmBtn: 'Bestätigen',
        pairVerifyingBadge: '🔒 Verschlüsselt · Kopplungscode wird verifiziert',
        pairVerifiedBadge: '🔐 Kopplungscode verifiziert',
        pairVerifiedMark: '✓ Kopplungscode verifiziert (automatischer Anti-MITM)',
        pairBarLabel: 'Kopplungscode:',
        pairFailed: 'Kopplungscode stimmt nicht überein oder Man-in-the-Middle — Verbindung getrennt',
        pairMissingCode: 'Geben Sie zuerst den vollständigen Kopplungscode (den vom System generierten) ein',
        pairTimedOut: 'Zeitüberschreitung bei der Kopplungsverifizierung — Verbindung getrennt (prüfen Sie, ob beide Seiten denselben Code verwenden)',
        pairJoinOptional: 'Kopplungscode (optional; ausfüllen, falls Ihr Peer ihn aktiviert hat — verifiziert automatisch, keine manuelle Sicherheitscode-Prüfung)',
        blobShareBtn: '📤 Datei teilen (Link)',
        blobShareTitle: 'Verschlüsseln & laden Sie eine Datei hoch, erhalten Sie einen Teilen-Link (der Empfänger muss nicht online sein — er lädt über den Link herunter)',
        blobUploading: 'Wird verschlüsselt & hochgeladen…',
        blobPasswordPrompt: 'Optional: Legen Sie ein Download-Passwort fest (leer lassen = der Link allein genügt). Falls festgelegt, benötigt der Empfänger Link + Passwort.',
        blobReady: '✅ Teilen-Link erstellt (Datei verschlüsselt & hochgeladen)',
        blobFailed: 'Datei-Upload fehlgeschlagen',
        blobTooLarge: 'Datei zu groß: Der gehostete Einzel-Upload ist auf ~95MB begrenzt (Cloudflare 100MB Request-Body-Limit). Größere Dateien benötigen einen Multipart-Upload (noch nicht unterstützt).',
        blobLinkHeading: '📦 Datei-Teilen-Link (enthält den Entschlüsselungsschlüssel — über einen vertrauenswürdigen Kanal senden)',
        blobLinkHint: '⚠️ Der Link enthält den Entschlüsselungsschlüssel; der Empfänger kann ihn herunterladen & entschlüsseln, ohne online zu sein. Läuft standardmäßig in 24h ab.',
        file: {
          attachTitle: 'Eine Datei oder ein Foto senden',
          busy: 'Es wird bereits eine Datei gesendet — warten Sie, bis sie fertig ist, bevor Sie eine weitere senden',
          tooLarge: 'Datei überschreitet das Limit von 100 MB',
          readFailed: 'Datei konnte nicht gelesen werden',
          offerFailed: 'Datei konnte nicht gesendet werden',
          sending: 'Wird gesendet',
          receiving: 'Wird empfangen',
          completed: 'Abgeschlossen',
          failed: 'Übertragung fehlgeschlagen',
          cancelled: 'Abgebrochen',
          verifyFailed: 'Dateiverifizierung fehlgeschlagen (Größe oder Hash stimmt nicht überein); verworfen',
          incoming: 'Eine Datei wird empfangen…',
          sent: 'Gesendet',
          received: 'Empfangen',
          download: 'Herunterladen',
          cancel: 'Abbrechen',
          imageAlt: 'Empfangenes Bild'
        }
      }
    }
  },
  'ru': {
    appTitle: 'VeilConnect',
    appSubtitle: 'P2P-чат с шифрованием',
    appDescription: 'P2P-приложение для чата со сквозным шифрованием, которое обеспечивает приватность и безопасность вашего общения без использования центральных серверов.',

    welcome: {
      title: 'VeilConnect',
      subtitle: 'P2P-чат с шифрованием',
      description: 'Добро пожаловать в VeilConnect! Это P2P-приложение для чата со сквозным шифрованием, которое обеспечивает приватность и безопасность вашего общения без использования центральных серверов.',
      features: {
        title: '🔐 Основные возможности',
        encryption: '• Сквозное шифрование (XSalsa20-Poly1305)',
        p2p: '• Прямая P2P-связь (WebRTC)',
        customId: '• Произвольный идентификатор пользователя',
        fileTransfer: '• Поддержка передачи файлов',
        decentralized: '• Полная децентрализация'
      },
      startButton: 'Начать'
    },

    identity: {
      generateButton: 'Создать новую личность',
      clearButton: 'Удалить личность',
      status: {
        active: '✅ Личность активна',
        inactive: 'ℹ️ Сначала создайте личность',
        pleaseGenerate: 'Сначала создайте личность'
      },
      userId: 'ID пользователя:',
      nickname: 'Псевдоним:',
      publicKey: 'Открытый ключ:',
      privateKey: 'Закрытый ключ:'
    },

    encryption: {
      title: '🔐 Проверка шифрования',
      inputPlaceholder: 'Введите текст для шифрования',
      testButton: 'Проверить шифрование',
      original: 'Исходный текст:',
      encrypted: 'Зашифровано:',
      decrypted: 'Расшифровано:',
      success: '✅ Проверка шифрования прошла успешно',
      error: 'Проверка шифрования не удалась',
      pleaseGenerateIdentity: 'Сначала создайте личность',
      pleaseEnterText: 'Введите текст для шифрования'
    },

    system: {
      title: '📊 Состояние системы',
      identityStatus: 'Статус личности:',
      messageCount: 'Количество сообщений:',
      contactCount: 'Количество контактов:',
      uptime: 'Время работы:',
      seconds: 'секунд'
    },

    features: {
      title: '🚀 Демонстрация основных возможностей',
      encryptionDemo: {
        title: '🔐 Сквозное шифрование',
        description: 'Защита сообщений алгоритмом XSalsa20-Poly1305',
        button: 'Демо шифрования'
      },
      identityDemo: {
        title: '🆔 Личность пользователя',
        description: 'Уникальная личность на основе открытого ключа Ed25519',
        button: 'Демо личности'
      },
      storageDemo: {
        title: '💾 Локальное хранилище',
        description: 'Локальное зашифрованное хранение сообщений и контактов',
        button: 'Демо хранилища'
      },
      p2pDemo: {
        title: '🌐 P2P-соединение',
        description: 'Прямая связь через WebRTC (нужны два клиента)',
        button: 'Демо P2P'
      }
    },

    log: {
      title: '📝 Системный журнал',
      clearButton: 'Очистить журнал',
      cleared: 'Журнал очищен'
    },

    settings: {
      title: '⚙️ Настройки',
      language: 'Язык',
      theme: 'Тема',
      notifications: 'Уведомления'
    },

    common: {
      save: 'Сохранить',
      cancel: 'Отмена',
      confirm: 'Подтвердить',
      delete: 'Удалить',
      edit: 'Изменить',
      close: 'Закрыть',
      back: 'Назад',
      next: 'Далее',
      loading: 'Загрузка...',
      error: 'Ошибка',
      success: 'Успешно',
      warning: 'Предупреждение',
      info: 'Информация'
    },

    completion: {
      title: 'Личность успешно создана!',
      description: '🎉 Поздравляем! Вы успешно создали свою личность в VeilConnect. Теперь вы можете устанавливать защищённые P2P-соединения с другими пользователями.',
      idType: 'Тип ID:',
      restartButton: 'Сбросить',
      chatButton: 'Начать чат',
      chatComingSoon: 'Функция чата в разработке...'
    },

    chat: {
      needIdentity: 'Требуется личность',
      generateFirst: 'Сначала создайте личность, чтобы начать общение',
      notConnected: 'Нет соединения',
      connecting: 'Подключение',
      connected: 'P2P-соединение установлено',
      disconnected: 'P2P-соединение потеряно',
      encrypted: 'Зашифрованная связь',
      offline: 'Не в сети',
      createConnection: 'Создать',
      joinConnection: 'Присоединиться',
      disconnect: 'Отключиться',
      connect: 'Подключиться',
      typePlaceholder: 'Введите сообщение...',
      connectToSend: 'Подключитесь к собеседнику, чтобы отправлять сообщения',
      shareConnection: 'Поделиться соединением',
      shareInstructions: 'Поделитесь этим ID соединения с другом:',
      joinInstructions: 'Введите ID соединения, полученный от друга:',
      connectionIdPlaceholder: 'Вставьте ID соединения сюда',
      waitingConnection: 'Ожидание подключения собеседника',
      connectionFailed: 'Не удалось создать соединение',
      joinFailed: 'Не удалось присоединиться к соединению',
      sendFailed: 'Не удалось отправить сообщение',
      idCopied: 'ID соединения скопирован в буфер обмена',
      send: 'Отправить',
      p2p: {
        headerTitle: '💬 Защищённый P2P-чат',
        editNicknameTitle: 'Нажмите, чтобы изменить свой псевдоним (виден собеседнику)',
        mePrefix: 'Я: ',
        unnamed: 'Без имени',
        badgeVerifiedTitle: 'Сообщения защищены сквозным шифрованием, и вы сверили код безопасности по отдельному каналу — посредника нет',
        badgeVerified: '🔒 Зашифровано · Проверено',
        badgeEncryptedTitle: 'Сообщения защищены сквозным шифрованием, но код безопасности не сверен по отдельному каналу, поэтому нельзя исключить посредника',
        badgePendingSas: '🔒 Зашифровано · Сверьте код безопасности',
        badgeHandshaking: '🔄 Установка защищённого соединения…',
        badgeFailed: '⛔ Проверка не пройдена',
        aboutTitle: 'О приложении / Приватность и локальные данные',
        aboutToggle: 'ⓘ О приложении',
        sasDialogTitle: '🛡️ Сверьте код безопасности',
        sasDialogBodyLine1: 'Прочитайте друг другу цифры ниже по доверенному каналу (по телефону / лично).',
        sasDialogBodyLine2: 'Только если они совпадают, посредника нет — это самый важный шаг.',
        peerPrefix: 'Собеседник: ',
        sasAgree: '✓ Совпадают, начать чат',
        sasDisagree: '✗ Различаются, отключиться',
        sasBarLabel: '🛡️ Код безопасности',
        sasVerifiedMark: '✓ Совпадение проверено',
        createRoomTitle: 'Создать строго комнату один-на-один: как только присоединятся 2 человека, любой другой со ссылкой будет отклонён сервером (комната заполнена).',
        createRoomBtn: '🔗 Создать комнату',
        oneToOneNote: '· Один-на-один (блокируется после 2 участников)',
        joinRoomBtn: '🔌 Войти в комнату',
        roomCreatedHeading: '🔗 Комната создана — отправьте ссылку собеседнику; соединение установится автоматически, когда он откроет её в браузере',
        establishingEncrypted: '🔄 Установка зашифрованного соединения…',
        waitingPeerJoin: '● Ожидание присоединения собеседника…',
        roomLinkWarning: '⚠️ Ссылка содержит одноразовый токен комнаты; отправляйте её по доверенному каналу. После подключения сверьте «код безопасности» ниже с собеседником по телефону / лично, прежде чем общаться — это ключевой шаг для исключения посредника (включая вредоносный сигнальный сервер).',
        copyLink: '📋 Копировать ссылку',
        collapse: 'Свернуть',
        aboutPrivacyTitle: 'Сообщения защищены сквозным шифрованием и передаются напрямую между участниками; сервер лишь передаёт данные для сопряжения и никогда не обрабатывает и не хранит сообщения',
        aboutPrivacyBody: '🔒 Сервер не хранит историю переписки; сообщения защищены сквозным шифрованием и передаются напрямую между участниками. История переписки хранится только в браузере этого устройства (очищается при закрытии страницы, никогда не загружается на сервер).',
        clearDataTitle: 'Удалить личность и все локальные данные, сохранённые в этом браузере, и вернуться к исходному состоянию',
        clearDataBtn: 'Очистить локальные данные',
        emptyConnected: 'Зашифрованный канал установлен — отправьте сообщение, чтобы начать общение.',
        emptyDisconnected: 'Нажмите «🔗 Создать комнату», чтобы сгенерировать ссылку для собеседника,\nили откройте присланную вам ссылку, чтобы начать чат со сквозным шифрованием.',
        placeholderWaitingSecure: 'Ожидание защищённого канала…',
        placeholderConfirmSas: 'Сначала сверьте код безопасности и нажмите «Совпадают»…',
        joinRoomDialogTitle: '🔌 Войти в комнату',
        pasteRoomLink: 'Вставьте ссылку на комнату, которую прислал собеседник:',
        cancel: 'Отмена',
        join: 'Войти',
        loadIdentityFailed: 'Не удалось прочитать локальную личность. Обновите страницу и попробуйте снова.',
        identityIncomplete: 'Локальная личность неполная; невозможно установить зашифрованный канал. Сбросьте личность и попробуйте снова.',
        secureChannelFailed: 'Не удалось установить зашифрованный канал. Попробуйте снова.',
        e2eEstablished: '🔐 Зашифрованный сквозной канал установлен. Сверьте код безопасности ниже с собеседником перед общением.',
        e2eEstablishing: '🔐 Установка зашифрованного сквозного канала…',
        peerVerifyFailed: '⛔ Не удалось проверить личность собеседника — возможно присутствие посредника. Соединение разорвано.',
        relayNotice: '🔒 Вы подключитесь к собеседнику с шифрованием через ретранслирующий сервер; ваш реальный IP ему не раскрывается.',
        connectedEstablishing: '✅ Соединение с собеседником установлено, настраивается сквозное шифрование…',
        connectFailed: 'Не удалось подключиться. Попробуйте снова.',
        peerDisconnected: 'Соединение с собеседником закрыто.',
        peerJoinedConnecting: 'Собеседник присоединился, подключение…',
        negotiationFailed: 'Не удалось согласовать соединение. Попробуйте снова.',
        negotiationError: 'Ошибка согласования соединения. Попробуйте снова.',
        peerLeft: 'Собеседник вышел; этот сеанс завершён.',
        signalingError: 'Ошибка службы соединения. Повторите попытку позже.',
        roomReadyWaiting: 'Комната готова, ожидание присоединения собеседника…',
        joinedConnecting: 'Вы вошли в комнату, подключение к собеседнику…',
        serverConnectFailed: 'Не удалось подключиться к серверу. Проверьте сеть и попробуйте снова.',
        notSecureYet: 'Защищённый канал не готов; отправка сообщений невозможна',
        verifySasFirst: 'Сначала сверьте код безопасности с собеседником по телефону / лично и убедитесь, что он совпадает, затем отправляйте сообщения',
        invalidRoomLink: 'Недействительная ссылка на комнату. Она должна выглядеть как https://…/#room=xxx&t=yyy',
        roomCodeBtn: '🔢 Код комнаты',
        roomCodeTitle: 'Подключиться по согласованному коду комнаты (без отправки длинной ссылки)',
        roomCodeDialogTitle: 'Подключение по коду комнаты',
        roomCodeDialogBody: 'Согласуйте одинаковый код комнаты: один нажимает «Создать», другой — «Войти». Отправлять длинную ссылку на комнату не нужно.',
        roomCodePlaceholder: 'Введите согласованный код комнаты (не менее 8 символов)',
        roomCodeSecurityHint: 'Код комнаты — это лишь метка для встречи, и его можно угадать; защита от посредника по-прежнему обеспечивается сверкой кода безопасности / кода сопряжения после подключения — обязательно выполните проверку.',
        roomCodeCreateBtn: 'Создать комнату',
        roomCodeJoinBtn: 'Войти в комнату',
        roomCodeTooShort: 'Код комнаты слишком короткий (не менее 8 символов)',
        roomCodeShareLabel: 'Сообщите собеседнику этот код комнаты:',
        roomCodeShareHint: 'Попросите его открыть «Код комнаты», нажать «Войти» и ввести тот же код. Не забудьте сверить код безопасности / сопряжения.',
        disconnectedManual: 'Соединение разорвано',
        copiedToClipboard: 'Скопировано в буфер обмена',
        relayNotReady: 'Ретранслирующий сервер не готов, и соединение может не установиться. Если он остаётся недоступным, обратитесь к администратору сайта.',
        sasMismatch: 'Код безопасности не совпадает — возможно присутствие посредника. Соединение разорвано.',
        nicknameUpdated: 'Псевдоним обновлён',
        nicknameUpdateFailed: 'Не удалось обновить псевдоним',
        sasConfirmedToast: 'Код безопасности подтверждён как совпадающий — можно начинать общение',
        setNicknamePrompt: 'Задайте свой псевдоним (виден собеседнику):',
        clearDataConfirm: 'Очистить все локальные данные на этом устройстве?\n\nЭто удалит зашифрованную личность и все локальные данные, сохранённые в этом браузере, и не может быть отменено (сервер всё равно ничего не хранит). После этого вы вернётесь к экрану «Задать пароль» и начнёте заново.',
        pairUseToggle: 'Использовать код сопряжения (автопроверка, без ручной сверки кода безопасности)',
        pairCodeLabel: 'Код сопряжения',
        pairShareHint: '⚠️ Передайте код сопряжения собеседнику по ДРУГОМУ доверенному каналу (лично / по телефону / через другое зашифрованное приложение) — никогда по тому же каналу, что и ссылку выше, иначе он не даёт никакой защиты.',
        pairEnterTitle: '🔑 Введите код сопряжения',
        pairEnterBody: 'Собеседник включил проверку по коду сопряжения. Введите код, который он передал вам по доверенному каналу, чтобы автоматически подтвердить отсутствие посредника.',
        pairEnterPlaceholder: 'например ABCD-1234-EFGH-…',
        pairConfirmBtn: 'Подтвердить',
        pairVerifyingBadge: '🔒 Зашифровано · проверка кода сопряжения',
        pairVerifiedBadge: '🔐 Код сопряжения проверен',
        pairVerifiedMark: '✓ Код сопряжения проверен (автозащита от посредника)',
        pairBarLabel: 'Код сопряжения:',
        pairFailed: 'Код сопряжения не совпадает или присутствует посредник — соединение разорвано',
        pairMissingCode: 'Сначала введите полный код сопряжения (сгенерированный системой)',
        pairTimedOut: 'Время проверки сопряжения истекло — соединение разорвано (убедитесь, что обе стороны используют один и тот же код)',
        pairJoinOptional: 'Код сопряжения (необязательно; заполните, если собеседник его включил — автопроверка, без ручной сверки кода безопасности)',
        blobShareBtn: '📤 Поделиться файлом (ссылка)',
        blobShareTitle: 'Зашифровать и загрузить файл, получить ссылку для обмена (получателю не обязательно быть онлайн — он скачает по ссылке)',
        blobUploading: 'Шифрование и загрузка…',
        blobPasswordPrompt: 'Необязательно: задайте пароль для скачивания (оставьте пустым = достаточно одной ссылки). Если задан, получателю нужны ссылка и пароль.',
        blobReady: '✅ Ссылка для обмена создана (файл зашифрован и загружен)',
        blobFailed: 'Не удалось загрузить файл',
        blobTooLarge: 'Файл слишком большой: при размещённой загрузке за один раз действует ограничение ~95MB (ограничение тела запроса Cloudflare 100MB). Для более крупных файлов нужна многочастная загрузка (пока не поддерживается).',
        blobLinkHeading: '📦 Ссылка для обмена файлом (содержит ключ расшифровки — отправляйте по доверенному каналу)',
        blobLinkHint: '⚠️ Ссылка содержит ключ расшифровки; получатель может скачать и расшифровать файл, не находясь онлайн. По умолчанию срок действия истекает через 24h.',
        file: {
          attachTitle: 'Отправить файл или фото',
          busy: 'Один файл уже отправляется — дождитесь завершения, прежде чем отправлять следующий',
          tooLarge: 'Файл превышает ограничение 100 MB',
          readFailed: 'Не удалось прочитать файл',
          offerFailed: 'Не удалось отправить файл',
          sending: 'Отправка',
          receiving: 'Получение',
          completed: 'Завершено',
          failed: 'Передача не удалась',
          cancelled: 'Отменено',
          verifyFailed: 'Проверка файла не пройдена (несовпадение размера или хеша); файл отброшен',
          incoming: 'Получение файла…',
          sent: 'Отправлено',
          received: 'Получено',
          download: 'Скачать',
          cancel: 'Отмена',
          imageAlt: 'Полученное изображение'
        }
      }
    }
  },
  'ar': {
    appTitle: 'VeilConnect',
    appSubtitle: 'دردشة مشفّرة من نظير إلى نظير (P2P)',
    appDescription: 'تطبيق دردشة مشفّر بالكامل من طرف إلى طرف ويعمل من نظير إلى نظير (P2P) يضمن خصوصية وأمان اتصالاتك دون الاعتماد على خوادم مركزية.',

    welcome: {
      title: 'VeilConnect',
      subtitle: 'دردشة مشفّرة من نظير إلى نظير (P2P)',
      description: 'مرحبًا بك في VeilConnect! هذا تطبيق دردشة مشفّر بالكامل من طرف إلى طرف ويعمل من نظير إلى نظير (P2P) يضمن خصوصية وأمان اتصالاتك دون الاعتماد على خوادم مركزية.',
      features: {
        title: '🔐 الميزات الأساسية',
        encryption: '• تشفير من طرف إلى طرف (XSalsa20-Poly1305)',
        p2p: '• اتصال مباشر من نظير إلى نظير (WebRTC)',
        customId: '• معرّف مستخدم مخصّص',
        fileTransfer: '• دعم نقل الملفات',
        decentralized: '• لا مركزية كاملة'
      },
      startButton: 'ابدأ الآن'
    },

    identity: {
      generateButton: 'إنشاء هوية جديدة',
      clearButton: 'مسح الهوية',
      status: {
        active: '✅ الهوية نشطة',
        inactive: 'ℹ️ يُرجى إنشاء هوية أولًا',
        pleaseGenerate: 'يُرجى إنشاء هوية أولًا'
      },
      userId: 'معرّف المستخدم:',
      nickname: 'الاسم المستعار:',
      publicKey: 'المفتاح العام:',
      privateKey: 'المفتاح الخاص:'
    },

    encryption: {
      title: '🔐 اختبار التشفير',
      inputPlaceholder: 'أدخل نصًا لتشفيره',
      testButton: 'اختبار التشفير',
      original: 'النص الأصلي:',
      encrypted: 'النص المشفّر:',
      decrypted: 'النص بعد فك التشفير:',
      success: '✅ نجح اختبار التشفير',
      error: 'فشل اختبار التشفير',
      pleaseGenerateIdentity: 'يُرجى إنشاء هوية أولًا',
      pleaseEnterText: 'يُرجى إدخال نص لتشفيره'
    },

    system: {
      title: '📊 حالة النظام',
      identityStatus: 'حالة الهوية:',
      messageCount: 'عدد الرسائل:',
      contactCount: 'عدد جهات الاتصال:',
      uptime: 'مدة التشغيل:',
      seconds: 'ثانية'
    },

    features: {
      title: '🚀 عرض توضيحي للميزات الأساسية',
      encryptionDemo: {
        title: '🔐 تشفير من طرف إلى طرف',
        description: 'رسائل آمنة باستخدام خوارزمية XSalsa20-Poly1305',
        button: 'عرض التشفير'
      },
      identityDemo: {
        title: '🆔 هوية المستخدم',
        description: 'هوية فريدة قائمة على المفتاح العام Ed25519',
        button: 'عرض الهوية'
      },
      storageDemo: {
        title: '💾 التخزين المحلي',
        description: 'تخزين محلي مشفّر للرسائل وجهات الاتصال',
        button: 'عرض التخزين'
      },
      p2pDemo: {
        title: '🌐 اتصال P2P',
        description: 'اتصال مباشر عبر WebRTC (يتطلّب عميلَين)',
        button: 'عرض P2P'
      }
    },

    log: {
      title: '📝 سجل النظام',
      clearButton: 'مسح السجل',
      cleared: 'تم مسح السجل'
    },

    settings: {
      title: '⚙️ الإعدادات',
      language: 'اللغة',
      theme: 'السمة',
      notifications: 'الإشعارات'
    },

    common: {
      save: 'حفظ',
      cancel: 'إلغاء',
      confirm: 'تأكيد',
      delete: 'حذف',
      edit: 'تعديل',
      close: 'إغلاق',
      back: 'رجوع',
      next: 'التالي',
      loading: 'جارٍ التحميل...',
      error: 'خطأ',
      success: 'نجاح',
      warning: 'تحذير',
      info: 'معلومة'
    },

    completion: {
      title: 'تم إنشاء الهوية بنجاح!',
      description: '🎉 تهانينا! لقد أنشأت هويتك على VeilConnect بنجاح. يمكنك الآن إنشاء اتصالات P2P آمنة مع مستخدمين آخرين.',
      idType: 'نوع المعرّف:',
      restartButton: 'إعادة تعيين',
      chatButton: 'بدء الدردشة',
      chatComingSoon: 'ميزة الدردشة قيد التطوير...'
    },

    chat: {
      needIdentity: 'الهوية مطلوبة',
      generateFirst: 'يُرجى إنشاء هوية أولًا لبدء الدردشة',
      notConnected: 'غير متصل',
      connecting: 'جارٍ الاتصال',
      connected: 'تم إنشاء اتصال P2P',
      disconnected: 'انقطع اتصال P2P',
      encrypted: 'اتصال مشفّر',
      offline: 'غير متصل',
      createConnection: 'إنشاء',
      joinConnection: 'انضمام',
      disconnect: 'قطع الاتصال',
      connect: 'اتصال',
      typePlaceholder: 'اكتب رسالة...',
      connectToSend: 'اتصل بنظير لإرسال الرسائل',
      shareConnection: 'مشاركة الاتصال',
      shareInstructions: 'شارك معرّف الاتصال هذا مع صديقك:',
      joinInstructions: 'أدخل معرّف الاتصال الذي أرسله إليك صديقك:',
      connectionIdPlaceholder: 'الصق معرّف الاتصال هنا',
      waitingConnection: 'في انتظار اتصال النظير',
      connectionFailed: 'فشل إنشاء الاتصال',
      joinFailed: 'فشل الانضمام إلى الاتصال',
      sendFailed: 'فشل إرسال الرسالة',
      idCopied: 'تم نسخ معرّف الاتصال إلى الحافظة',
      send: 'إرسال',
      p2p: {
        headerTitle: '💬 دردشة P2P آمنة',
        editNicknameTitle: 'انقر لتغيير اسمك المستعار (مرئي للنظير)',
        mePrefix: 'أنا: ',
        unnamed: 'بلا اسم',
        badgeVerifiedTitle: 'الرسائل مشفّرة من طرف إلى طرف، وقد تحقّقت من رمز الأمان عبر قناة خارجية — لا وجود لوسيط خبيث',
        badgeVerified: '🔒 مشفّر · مُتحقَّق منه',
        badgeEncryptedTitle: 'الرسائل مشفّرة من طرف إلى طرف، لكن لم يتم التحقّق من رمز الأمان عبر قناة خارجية، لذا لا يمكن استبعاد وجود وسيط خبيث',
        badgePendingSas: '🔒 مشفّر · تحقّق من رمز الأمان',
        badgeHandshaking: '🔄 جارٍ تأمين الاتصال…',
        badgeFailed: '⛔ فشل التحقّق',
        aboutTitle: 'حول / الخصوصية والبيانات المحلية',
        aboutToggle: 'ⓘ حول',
        sasDialogTitle: '🛡️ تحقّق من رمز الأمان',
        sasDialogBodyLine1: 'اقرآ الأرقام أدناه لبعضكما عبر قناة موثوقة (هاتف / لقاء شخصي).',
        sasDialogBodyLine2: 'فقط إذا تطابقت فلا يوجد وسيط خبيث — هذه هي الخطوة الأهم.',
        peerPrefix: 'النظير: ',
        sasAgree: '✓ متطابقة، ابدأ الدردشة',
        sasDisagree: '✗ مختلفة، اقطع الاتصال',
        sasBarLabel: '🛡️ رمز الأمان',
        sasVerifiedMark: '✓ تطابق مُتحقَّق منه',
        createRoomTitle: 'أنشئ غرفة فردية صارمة واحدًا لواحد: بمجرد انضمام شخصين، يرفض الخادم أي شخص آخر يملك الرابط (الغرفة ممتلئة).',
        createRoomBtn: '🔗 إنشاء غرفة',
        oneToOneNote: '· فردية واحدًا لواحد (تُقفل بعد انضمام شخصين)',
        joinRoomBtn: '🔌 الانضمام إلى غرفة',
        roomCreatedHeading: '🔗 تم إنشاء الغرفة — أرسل الرابط إلى نظيرك؛ سينضم تلقائيًا عند فتحه في متصفح',
        establishingEncrypted: '🔄 جارٍ إنشاء اتصال مشفّر…',
        waitingPeerJoin: '● في انتظار انضمام النظير…',
        roomLinkWarning: '⚠️ يحتوي الرابط على رمز غرفة لمرة واحدة؛ أرسله عبر قناة موثوقة. بعد الاتصال، تحقّق من «رمز الأمان» أدناه مع نظيرك عبر الهاتف / لقاء شخصي قبل الدردشة — هذه هي الخطوة الأساسية لاستبعاد وجود وسيط خبيث (بما في ذلك خادم إشارات خبيث).',
        copyLink: '📋 نسخ الرابط',
        collapse: 'طيّ',
        aboutPrivacyTitle: 'الرسائل مشفّرة من طرف إلى طرف وتُرسَل من نظير إلى نظير؛ يقوم الخادم فقط بترحيل الاقتران ولا يعالج أو يخزّن أي رسالة على الإطلاق',
        aboutPrivacyBody: '🔒 لا يخزّن الخادم أي سجل دردشة؛ الرسائل مشفّرة من طرف إلى طرف وتُرسَل من نظير إلى نظير. يبقى سجل الدردشة فقط في متصفح هذا الجهاز (يُمسح عند إغلاق الصفحة، ولا يُرفع أبدًا).',
        clearDataTitle: 'احذف الهوية وجميع البيانات المحلية المحفوظة في هذا المتصفح، والعودة إلى الحالة الأولية',
        clearDataBtn: 'مسح البيانات المحلية',
        emptyConnected: 'تم إنشاء قناة مشفّرة — أرسل رسالة لبدء الدردشة.',
        emptyDisconnected: 'انقر على «🔗 إنشاء غرفة» لتوليد رابط لنظيرك،\nأو افتح رابطًا أرسله إليك، لبدء دردشة مشفّرة من طرف إلى طرف.',
        placeholderWaitingSecure: 'في انتظار القناة الآمنة…',
        placeholderConfirmSas: 'تحقّق أولًا من رمز الأمان وانقر على «متطابقة»…',
        joinRoomDialogTitle: '🔌 الانضمام إلى غرفة',
        pasteRoomLink: 'الصق رابط الغرفة الذي أرسله إليك نظيرك:',
        cancel: 'إلغاء',
        join: 'انضمام',
        loadIdentityFailed: 'فشل قراءة الهوية المحلية. يُرجى تحديث الصفحة والمحاولة مجددًا.',
        identityIncomplete: 'الهوية المحلية غير مكتملة؛ يتعذّر إنشاء قناة مشفّرة. يُرجى إعادة تعيين هويتك والمحاولة مجددًا.',
        secureChannelFailed: 'فشل إنشاء القناة المشفّرة. يُرجى المحاولة مجددًا.',
        e2eEstablished: '🔐 تم إنشاء قناة مشفّرة من طرف إلى طرف. تحقّق من رمز الأمان أدناه مع نظيرك قبل الدردشة.',
        e2eEstablishing: '🔐 جارٍ إنشاء قناة مشفّرة من طرف إلى طرف…',
        peerVerifyFailed: '⛔ فشل التحقّق من هوية النظير — قد يكون هناك وسيط خبيث. تم قطع الاتصال.',
        relayNotice: '🔒 ستتصل بنظيرك بشكل مشفّر عبر خادم ترحيل؛ لن يُكشف عنوان IP الحقيقي الخاص بك له.',
        connectedEstablishing: '✅ تم الاتصال بالنظير، جارٍ إنشاء التشفير من طرف إلى طرف…',
        connectFailed: 'فشل الاتصال. يُرجى المحاولة مجددًا.',
        peerDisconnected: 'تم إغلاق الاتصال بنظيرك.',
        peerJoinedConnecting: 'انضمّ النظير، جارٍ الاتصال…',
        negotiationFailed: 'فشل التفاوض على الاتصال. يُرجى المحاولة مجددًا.',
        negotiationError: 'خطأ في التفاوض على الاتصال. يُرجى المحاولة مجددًا.',
        peerLeft: 'غادر نظيرك؛ انتهت هذه الجلسة.',
        signalingError: 'حدث خطأ في خدمة الاتصال. يُرجى المحاولة لاحقًا.',
        roomReadyWaiting: 'الغرفة جاهزة، في انتظار انضمام النظير…',
        joinedConnecting: 'تم الانضمام إلى الغرفة، جارٍ الاتصال بالنظير…',
        serverConnectFailed: 'يتعذّر الاتصال بالخادم. تحقّق من شبكتك وحاول مجددًا.',
        notSecureYet: 'القناة الآمنة غير جاهزة؛ يتعذّر إرسال الرسائل',
        verifySasFirst: 'تحقّق أولًا من رمز الأمان مع نظيرك عبر الهاتف / لقاء شخصي وأكّد تطابقه، ثم أرسل الرسائل',
        invalidRoomLink: 'رابط غرفة غير صالح. يجب أن يبدو مثل https://…/#room=xxx&t=yyy',
        roomCodeBtn: '🔢 رمز الغرفة',
        roomCodeTitle: 'اتصل برمز غرفة متفق عليه (دون إرسال رابط طويل)',
        roomCodeDialogTitle: 'الاتصال برمز الغرفة',
        roomCodeDialogBody: 'اتفقا على رمز الغرفة نفسه: ينقر أحدكما على إنشاء، والآخر على انضمام. لا حاجة لإرسال رابط الغرفة الطويل.',
        roomCodePlaceholder: 'أدخل رمز الغرفة المتفق عليه (8 أحرف على الأقل)',
        roomCodeSecurityHint: 'رمز الغرفة هو مجرد عنوان للقاء ويمكن تخمينه؛ تأتي الحماية من الوسيط الخبيث من التحقّق من رمز الأمان / رمز الاقتران بعد الاتصال — احرص على التحقّق.',
        roomCodeCreateBtn: 'إنشاء غرفة',
        roomCodeJoinBtn: 'الانضمام إلى غرفة',
        roomCodeTooShort: 'رمز الغرفة قصير جدًا (8 أحرف على الأقل)',
        roomCodeShareLabel: 'أخبر نظيرك برمز الغرفة هذا:',
        roomCodeShareHint: 'اطلب منه فتح «رمز الغرفة» والنقر على انضمام وإدخال الرمز نفسه. تذكّر التحقّق من رمز الأمان / الاقتران.',
        disconnectedManual: 'تم قطع الاتصال',
        copiedToClipboard: 'تم النسخ إلى الحافظة',
        relayNotReady: 'خادم الترحيل غير جاهز وقد يفشل الاتصال. إذا ظلّ غير قابل للوصول، فاتصل بمسؤول الموقع.',
        sasMismatch: 'عدم تطابق رمز الأمان — احتمال وجود وسيط خبيث. تم قطع الاتصال.',
        nicknameUpdated: 'تم تحديث الاسم المستعار',
        nicknameUpdateFailed: 'فشل تحديث الاسم المستعار',
        sasConfirmedToast: 'تم تأكيد تطابق رمز الأمان — يمكنك بدء الدردشة',
        setNicknamePrompt: 'عيّن اسمك المستعار (مرئي للنظير):',
        clearDataConfirm: 'مسح جميع البيانات المحلية على هذا الجهاز؟\n\nيؤدي هذا إلى حذف الهوية المشفّرة وجميع البيانات المحلية المحفوظة في هذا المتصفح، ولا يمكن التراجع عنه (لا يخزّن الخادم أي شيء على أي حال). بعد ذلك ستعود إلى «تعيين عبارة المرور» والبدء من جديد.',
        pairUseToggle: 'استخدام رمز اقتران (تحقّق تلقائي، دون فحص يدوي لرمز الأمان)',
        pairCodeLabel: 'رمز الاقتران',
        pairShareHint: '⚠️ شارك رمز الاقتران مع نظيرك عبر قناة موثوقة مختلفة (لقاء شخصي / هاتف / تطبيق مشفّر آخر) — لا تشاركه أبدًا عبر القناة نفسها التي أرسلت بها الرابط أعلاه، وإلا فلن يوفّر أي حماية.',
        pairEnterTitle: '🔑 أدخل رمز الاقتران',
        pairEnterBody: 'فعّل نظيرك التحقّق برمز الاقتران. أدخل الرمز الذي أعطاك إياه عبر قناة موثوقة لتأكيد عدم وجود وسيط خبيث تلقائيًا.',
        pairEnterPlaceholder: 'مثال: ABCD-1234-EFGH-…',
        pairConfirmBtn: 'تأكيد',
        pairVerifyingBadge: '🔒 مشفّر · جارٍ التحقّق من رمز الاقتران',
        pairVerifiedBadge: '🔐 تم التحقّق من رمز الاقتران',
        pairVerifiedMark: '✓ تم التحقّق من رمز الاقتران (مضاد تلقائي للوسيط الخبيث)',
        pairBarLabel: 'رمز الاقتران:',
        pairFailed: 'عدم تطابق رمز الاقتران أو وجود وسيط خبيث — تم قطع الاتصال',
        pairMissingCode: 'أدخل أولًا رمز الاقتران الكامل (الذي ولّده النظام)',
        pairTimedOut: 'انتهت مهلة التحقّق من الاقتران — تم قطع الاتصال (تأكّد من استخدام الطرفين للرمز نفسه)',
        pairJoinOptional: 'رمز الاقتران (اختياري؛ املأه إذا فعّله نظيرك — يتحقّق تلقائيًا، دون فحص يدوي لرمز الأمان)',
        blobShareBtn: '📤 مشاركة ملف (رابط)',
        blobShareTitle: 'شفّر ملفًا وارفعه، واحصل على رابط مشاركة (لا يلزم أن يكون المستلِم متصلًا — يُنزّله عبر الرابط)',
        blobUploading: 'جارٍ التشفير والرفع…',
        blobPasswordPrompt: 'اختياري: عيّن كلمة مرور للتنزيل (اتركها فارغة = الرابط وحده يكفي). إذا عُيّنت، يحتاج المستلِم إلى الرابط + كلمة المرور.',
        blobReady: '✅ تم إنشاء رابط المشاركة (تم تشفير الملف ورفعه)',
        blobFailed: 'فشل رفع الملف',
        blobTooLarge: 'الملف كبير جدًا: الرفع الفردي المُستضاف محدود بـ ~95MB (حد جسم الطلب 100 MB في Cloudflare). تتطلّب الملفات الأكبر رفعًا متعدّد الأجزاء (غير مدعوم بعد).',
        blobLinkHeading: '📦 رابط مشاركة الملف (يحتوي على مفتاح فك التشفير — أرسله عبر قناة موثوقة)',
        blobLinkHint: '⚠️ يحتوي الرابط على مفتاح فك التشفير؛ يمكن للمستلِم التنزيل وفك التشفير دون أن يكون متصلًا. تنتهي صلاحيته خلال 24h افتراضيًا.',
        file: {
          attachTitle: 'إرسال ملف أو صورة',
          busy: 'يجري إرسال ملف بالفعل — انتظر حتى ينتهي قبل إرسال آخر',
          tooLarge: 'يتجاوز الملف حد 100 MB',
          readFailed: 'فشل قراءة الملف',
          offerFailed: 'فشل إرسال الملف',
          sending: 'جارٍ الإرسال',
          receiving: 'جارٍ الاستقبال',
          completed: 'مكتمل',
          failed: 'فشل النقل',
          cancelled: 'تم الإلغاء',
          verifyFailed: 'فشل التحقّق من الملف (عدم تطابق الحجم أو التجزئة)؛ تم تجاهله',
          incoming: 'جارٍ استقبال ملف…',
          sent: 'تم الإرسال',
          received: 'تم الاستقبال',
          download: 'تنزيل',
          cancel: 'إلغاء',
          imageAlt: 'صورة مستلَمة'
        }
      }
    }
  },
  'pt': {
    appTitle: 'VeilConnect',
    appSubtitle: 'Chat Encriptado P2P',
    appDescription: 'Uma aplicação de chat encriptada de ponta a ponta P2P que garante a privacidade e a segurança da sua comunicação sem depender de servidores centrais.',

    welcome: {
      title: 'VeilConnect',
      subtitle: 'Chat Encriptado P2P',
      description: 'Bem-vindo ao VeilConnect! Esta é uma aplicação de chat encriptada de ponta a ponta P2P que garante a privacidade e a segurança da sua comunicação sem depender de servidores centrais.',
      features: {
        title: '🔐 Funcionalidades Principais',
        encryption: '• Encriptação de ponta a ponta (XSalsa20-Poly1305)',
        p2p: '• Comunicação direta P2P (WebRTC)',
        customId: '• ID de utilizador personalizado',
        fileTransfer: '• Suporte para transferência de ficheiros',
        decentralized: '• Totalmente descentralizado'
      },
      startButton: 'Começar'
    },

    identity: {
      generateButton: 'Gerar Nova Identidade',
      clearButton: 'Limpar Identidade',
      status: {
        active: '✅ Identidade Ativa',
        inactive: 'ℹ️ Gere primeiro uma identidade',
        pleaseGenerate: 'Gere primeiro uma identidade'
      },
      userId: 'ID de Utilizador:',
      nickname: 'Alcunha:',
      publicKey: 'Chave Pública:',
      privateKey: 'Chave Privada:'
    },

    encryption: {
      title: '🔐 Teste de Encriptação',
      inputPlaceholder: 'Introduza o texto a encriptar',
      testButton: 'Testar Encriptação',
      original: 'Original:',
      encrypted: 'Encriptado:',
      decrypted: 'Desencriptado:',
      success: '✅ Teste de encriptação bem-sucedido',
      error: 'O teste de encriptação falhou',
      pleaseGenerateIdentity: 'Gere primeiro uma identidade',
      pleaseEnterText: 'Introduza o texto a encriptar'
    },

    system: {
      title: '📊 Estado do Sistema',
      identityStatus: 'Estado da Identidade:',
      messageCount: 'Número de Mensagens:',
      contactCount: 'Número de Contactos:',
      uptime: 'Tempo Ativo:',
      seconds: 'segundos'
    },

    features: {
      title: '🚀 Demonstração das Funcionalidades Principais',
      encryptionDemo: {
        title: '🔐 Encriptação de Ponta a Ponta',
        description: 'Proteja mensagens com o algoritmo XSalsa20-Poly1305',
        button: 'Demonstrar Encriptação'
      },
      identityDemo: {
        title: '🆔 Identidade do Utilizador',
        description: 'Identidade única baseada na chave pública Ed25519',
        button: 'Demonstrar Identidade'
      },
      storageDemo: {
        title: '💾 Armazenamento Local',
        description: 'Armazenamento local encriptado para mensagens e contactos',
        button: 'Demonstrar Armazenamento'
      },
      p2pDemo: {
        title: '🌐 Ligação P2P',
        description: 'Comunicação direta WebRTC (requer dois clientes)',
        button: 'Demonstrar P2P'
      }
    },

    log: {
      title: '📝 Registo do Sistema',
      clearButton: 'Limpar Registo',
      cleared: 'Registo limpo'
    },

    settings: {
      title: '⚙️ Definições',
      language: 'Idioma',
      theme: 'Tema',
      notifications: 'Notificações'
    },

    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      delete: 'Eliminar',
      edit: 'Editar',
      close: 'Fechar',
      back: 'Voltar',
      next: 'Seguinte',
      loading: 'A carregar...',
      error: 'Erro',
      success: 'Sucesso',
      warning: 'Aviso',
      info: 'Informação'
    },

    completion: {
      title: 'Identidade Criada com Sucesso!',
      description: '🎉 Parabéns! Criou com sucesso a sua identidade VeilConnect. Pode agora estabelecer ligações P2P seguras com outros utilizadores.',
      idType: 'Tipo de ID:',
      restartButton: 'Repor',
      chatButton: 'Iniciar Conversa',
      chatComingSoon: 'A funcionalidade de conversa está em desenvolvimento...'
    },

    chat: {
      needIdentity: 'Identidade Necessária',
      generateFirst: 'Gere primeiro uma identidade para começar a conversar',
      notConnected: 'Sem Ligação',
      connecting: 'A ligar',
      connected: 'Ligação P2P estabelecida',
      disconnected: 'Ligação P2P perdida',
      encrypted: 'Comunicação Encriptada',
      offline: 'Offline',
      createConnection: 'Criar',
      joinConnection: 'Aderir',
      disconnect: 'Desligar',
      connect: 'Ligar',
      typePlaceholder: 'Escreva uma mensagem...',
      connectToSend: 'Ligue-se a um par para enviar mensagens',
      shareConnection: 'Partilhar Ligação',
      shareInstructions: 'Partilhe este ID de ligação com o seu amigo:',
      joinInstructions: 'Introduza o ID de ligação do seu amigo:',
      connectionIdPlaceholder: 'Cole aqui o ID de ligação',
      waitingConnection: 'À espera que o par se ligue',
      connectionFailed: 'Falha ao criar a ligação',
      joinFailed: 'Falha ao aderir à ligação',
      sendFailed: 'Falha ao enviar a mensagem',
      idCopied: 'ID de ligação copiado para a área de transferência',
      send: 'Enviar',
      p2p: {
        headerTitle: '💬 Chat Seguro P2P',
        editNicknameTitle: 'Clique para alterar a sua alcunha (visível para o seu par)',
        mePrefix: 'Eu: ',
        unnamed: 'Sem nome',
        badgeVerifiedTitle: 'As mensagens são encriptadas de ponta a ponta e verificou o código de segurança fora de banda — sem intermediários',
        badgeVerified: '🔒 Encriptado · Verificado',
        badgeEncryptedTitle: 'As mensagens são encriptadas de ponta a ponta, mas o código de segurança não foi verificado fora de banda, pelo que não é possível excluir um intermediário',
        badgePendingSas: '🔒 Encriptado · Verifique o código de segurança',
        badgeHandshaking: '🔄 A proteger a ligação…',
        badgeFailed: '⛔ Verificação falhou',
        aboutTitle: 'Acerca / Privacidade e dados locais',
        aboutToggle: 'ⓘ Acerca',
        sasDialogTitle: '🛡️ Verificar código de segurança',
        sasDialogBodyLine1: 'Leiam os dígitos abaixo um ao outro através de um canal de confiança (telefone / pessoalmente).',
        sasDialogBodyLine2: 'Só se coincidirem é que não há intermediário — este é o passo mais importante.',
        peerPrefix: 'Par: ',
        sasAgree: '✓ Coincidem, começar a conversar',
        sasDisagree: '✗ São diferentes, desligar',
        sasBarLabel: '🛡️ Código de segurança',
        sasVerifiedMark: '✓ Coincidência verificada',
        createRoomTitle: 'Crie uma sala estrita de um para um: assim que 2 pessoas aderirem, qualquer outra com o link é rejeitada pelo servidor (Sala cheia).',
        createRoomBtn: '🔗 Criar sala',
        oneToOneNote: '· Um para um (bloqueia após 2 aderirem)',
        joinRoomBtn: '🔌 Aderir à sala',
        roomCreatedHeading: '🔗 Sala criada — envie o link ao seu par; adere automaticamente quando ele o abrir num navegador',
        establishingEncrypted: '🔄 A estabelecer a ligação encriptada…',
        waitingPeerJoin: '● À espera que o par adira…',
        roomLinkWarning: '⚠️ O link contém um token de sala de utilização única; envie-o através de um canal de confiança. Após a ligação, verifique o “código de segurança” abaixo com o seu par por telefone / pessoalmente antes de conversar — este é o passo-chave para excluir um intermediário (incluindo um servidor de sinalização malicioso).',
        copyLink: '📋 Copiar link',
        collapse: 'Recolher',
        aboutPrivacyTitle: 'As mensagens são encriptadas de ponta a ponta e enviadas par a par; o servidor apenas retransmite o emparelhamento e nunca processa nem armazena qualquer mensagem',
        aboutPrivacyBody: '🔒 O servidor não armazena qualquer histórico de conversas; as mensagens são encriptadas de ponta a ponta e enviadas par a par. O histórico de conversas existe apenas no navegador deste dispositivo (apagado quando a página é fechada, nunca carregado).',
        clearDataTitle: 'Eliminar a identidade e todos os dados locais guardados neste navegador, voltando ao estado inicial',
        clearDataBtn: 'Limpar dados locais',
        emptyConnected: 'Canal encriptado estabelecido — envie uma mensagem para começar a conversar.',
        emptyDisconnected: 'Clique em “🔗 Criar sala” para gerar um link para o seu par,\nou abra um link que ele lhe enviou, para iniciar uma conversa encriptada de ponta a ponta.',
        placeholderWaitingSecure: 'À espera do canal seguro…',
        placeholderConfirmSas: 'Primeiro verifique o código de segurança e clique em “Coincidem”…',
        joinRoomDialogTitle: '🔌 Aderir à sala',
        pasteRoomLink: 'Cole o link da sala que o seu par lhe enviou:',
        cancel: 'Cancelar',
        join: 'Aderir',
        loadIdentityFailed: 'Falha ao ler a identidade local. Atualize a página e tente novamente.',
        identityIncomplete: 'A identidade local está incompleta; não é possível estabelecer um canal encriptado. Reponha a sua identidade e tente novamente.',
        secureChannelFailed: 'Falha ao estabelecer o canal encriptado. Tente novamente.',
        e2eEstablished: '🔐 Canal encriptado de ponta a ponta estabelecido. Verifique o código de segurança abaixo com o seu par antes de conversar.',
        e2eEstablishing: '🔐 A estabelecer o canal encriptado de ponta a ponta…',
        peerVerifyFailed: '⛔ Falha na verificação da identidade do par — pode estar presente um intermediário. Ligação terminada.',
        relayNotice: '🔒 Vai ligar-se ao seu par de forma encriptada através de um servidor de retransmissão; o seu IP real não fica exposto a ele.',
        connectedEstablishing: '✅ Ligado ao par, a estabelecer a encriptação de ponta a ponta…',
        connectFailed: 'Falha ao ligar. Tente novamente.',
        peerDisconnected: 'A ligação ao seu par foi terminada.',
        peerJoinedConnecting: 'O par aderiu, a ligar…',
        negotiationFailed: 'A negociação da ligação falhou. Tente novamente.',
        negotiationError: 'Erro na negociação da ligação. Tente novamente.',
        peerLeft: 'O seu par saiu; esta sessão terminou.',
        signalingError: 'O serviço de ligação teve um erro. Tente novamente mais tarde.',
        roomReadyWaiting: 'Sala pronta, à espera que o par adira…',
        joinedConnecting: 'Aderiu à sala, a ligar ao par…',
        serverConnectFailed: 'Não é possível ligar ao servidor. Verifique a sua rede e tente novamente.',
        notSecureYet: 'O canal seguro não está pronto; não é possível enviar mensagens',
        verifySasFirst: 'Primeiro verifique o código de segurança com o seu par por telefone / pessoalmente e confirme que coincide, depois envie mensagens',
        invalidRoomLink: 'Link de sala inválido. Deve ter o aspeto https://…/#room=xxx&t=yyy',
        roomCodeBtn: '🔢 Código da sala',
        roomCodeTitle: 'Ligue-se com um código de sala combinado (sem link longo para enviar)',
        roomCodeDialogTitle: 'Ligar por código de sala',
        roomCodeDialogBody: 'Combinem o mesmo código de sala: uma pessoa toca em Criar, a outra toca em Aderir. Não é preciso enviar o link longo da sala.',
        roomCodePlaceholder: 'Introduza o código de sala combinado (mín. 8 chars)',
        roomCodeSecurityHint: 'Um código de sala é apenas uma etiqueta de encontro e pode ser adivinhado; a proteção contra intermediários continua a vir da verificação do código de segurança / código de emparelhamento após a ligação — verifique sem falta.',
        roomCodeCreateBtn: 'Criar sala',
        roomCodeJoinBtn: 'Aderir à sala',
        roomCodeTooShort: 'Código de sala demasiado curto (mín. 8 chars)',
        roomCodeShareLabel: 'Indique ao seu par este código de sala:',
        roomCodeShareHint: 'Peça-lhe que abra “Código da sala”, toque em Aderir e introduza o mesmo código. Lembre-se de verificar o código de segurança/emparelhamento.',
        disconnectedManual: 'Ligação terminada',
        copiedToClipboard: 'Copiado para a área de transferência',
        relayNotReady: 'O servidor de retransmissão não está pronto e a ligação pode falhar. Se continuar inacessível, contacte o administrador do site.',
        sasMismatch: 'O código de segurança não coincide — possível intermediário. Ligação terminada.',
        nicknameUpdated: 'Alcunha atualizada',
        nicknameUpdateFailed: 'Falha ao atualizar a alcunha',
        sasConfirmedToast: 'Código de segurança confirmado como coincidente — pode começar a conversar',
        setNicknamePrompt: 'Defina a sua alcunha (visível para o seu par):',
        clearDataConfirm: 'Limpar todos os dados locais neste dispositivo?\n\nIsto elimina a identidade encriptada e todos os dados locais guardados neste navegador, e não pode ser anulado (o servidor não armazena nada de qualquer forma). Depois volta a “Definir frase de acesso” e começa de novo.',
        pairUseToggle: 'Usar um código de emparelhamento (verificação automática, sem verificação manual do código de segurança)',
        pairCodeLabel: 'Código de emparelhamento',
        pairShareHint: '⚠️ Partilhe o código de emparelhamento com o seu par através de um canal de confiança DIFERENTE (pessoalmente / telefone / outra aplicação encriptada) — nunca pelo mesmo canal do link acima, ou não oferece qualquer proteção.',
        pairEnterTitle: '🔑 Introduzir código de emparelhamento',
        pairEnterBody: 'O seu par ativou a verificação por código de emparelhamento. Introduza o código que ele lhe deu através de um canal de confiança para confirmar automaticamente que não há intermediário.',
        pairEnterPlaceholder: 'ex. ABCD-1234-EFGH-…',
        pairConfirmBtn: 'Confirmar',
        pairVerifyingBadge: '🔒 Encriptado · a verificar o código de emparelhamento',
        pairVerifiedBadge: '🔐 Código de emparelhamento verificado',
        pairVerifiedMark: '✓ Código de emparelhamento verificado (anti-intermediário automático)',
        pairBarLabel: 'Código de emparelhamento:',
        pairFailed: 'O código de emparelhamento não coincide ou há um intermediário — ligação terminada',
        pairMissingCode: 'Introduza primeiro o código de emparelhamento completo (o gerado pelo sistema)',
        pairTimedOut: 'A verificação de emparelhamento expirou — ligação terminada (confirme que ambos os lados usam o mesmo código)',
        pairJoinOptional: 'Código de emparelhamento (opcional; preencha se o seu par o ativou — verifica automaticamente, sem verificação manual do código de segurança)',
        blobShareBtn: '📤 Partilhar um ficheiro (link)',
        blobShareTitle: 'Encripte e carregue um ficheiro, obtenha um link de partilha (o destinatário não precisa de estar online — descarrega-o através do link)',
        blobUploading: 'A encriptar e a carregar…',
        blobPasswordPrompt: 'Opcional: defina uma palavra-passe de descarregamento (deixe vazio = o link sozinho basta). Se definida, o destinatário precisa do link + palavra-passe.',
        blobReady: '✅ Link de partilha criado (ficheiro encriptado e carregado)',
        blobFailed: 'Falha no carregamento do ficheiro',
        blobTooLarge: 'Ficheiro demasiado grande: o carregamento único alojado está limitado a ~95MB (limite de corpo de pedido de 100MB da Cloudflare). Ficheiros maiores necessitam de carregamento multipart (ainda não suportado).',
        blobLinkHeading: '📦 Link de partilha de ficheiro (contém a chave de desencriptação — envie através de um canal de confiança)',
        blobLinkHint: '⚠️ O link contém a chave de desencriptação; o destinatário pode descarregar e desencriptar sem estar online. Expira em 24h por predefinição.',
        file: {
          attachTitle: 'Enviar um ficheiro ou foto',
          busy: 'Já está a ser enviado um ficheiro — aguarde que termine antes de enviar outro',
          tooLarge: 'O ficheiro excede o limite de 100 MB',
          readFailed: 'Falha ao ler o ficheiro',
          offerFailed: 'Falha ao enviar o ficheiro',
          sending: 'A enviar',
          receiving: 'A receber',
          completed: 'Concluído',
          failed: 'A transferência falhou',
          cancelled: 'Cancelado',
          verifyFailed: 'Falha na verificação do ficheiro (tamanho ou hash não coincide); descartado',
          incoming: 'A receber um ficheiro…',
          sent: 'Enviado',
          received: 'Recebido',
          download: 'Descarregar',
          cancel: 'Cancelar',
          imageAlt: 'Imagem recebida'
        }
      }
    }
  },
  'it': {
    appTitle: 'VeilConnect',
    appSubtitle: 'Chat crittografata P2P',
    appDescription: 'Un’applicazione di chat crittografata end-to-end P2P che garantisce la privacy e la sicurezza delle tue comunicazioni senza dipendere da server centrali.',

    welcome: {
      title: 'VeilConnect',
      subtitle: 'Chat crittografata P2P',
      description: 'Benvenuto in VeilConnect! Questa è un’applicazione di chat crittografata end-to-end P2P che garantisce la privacy e la sicurezza delle tue comunicazioni senza dipendere da server centrali.',
      features: {
        title: '🔐 Funzioni principali',
        encryption: '• Crittografia end-to-end (XSalsa20-Poly1305)',
        p2p: '• Comunicazione diretta P2P (WebRTC)',
        customId: '• ID utente personalizzato',
        fileTransfer: '• Supporto al trasferimento di file',
        decentralized: '• Completamente decentralizzato'
      },
      startButton: 'Inizia'
    },

    identity: {
      generateButton: 'Genera nuova identità',
      clearButton: 'Cancella identità',
      status: {
        active: '✅ Identità attiva',
        inactive: 'ℹ️ Genera prima un’identità',
        pleaseGenerate: 'Genera prima un’identità'
      },
      userId: 'ID utente:',
      nickname: 'Soprannome:',
      publicKey: 'Chiave pubblica:',
      privateKey: 'Chiave privata:'
    },

    encryption: {
      title: '🔐 Test di crittografia',
      inputPlaceholder: 'Inserisci il testo da crittografare',
      testButton: 'Testa la crittografia',
      original: 'Originale:',
      encrypted: 'Crittografato:',
      decrypted: 'Decrittografato:',
      success: '✅ Test di crittografia riuscito',
      error: 'Test di crittografia non riuscito',
      pleaseGenerateIdentity: 'Genera prima un’identità',
      pleaseEnterText: 'Inserisci il testo da crittografare'
    },

    system: {
      title: '📊 Stato del sistema',
      identityStatus: 'Stato identità:',
      messageCount: 'Numero di messaggi:',
      contactCount: 'Numero di contatti:',
      uptime: 'Tempo di attività:',
      seconds: 'secondi'
    },

    features: {
      title: '🚀 Demo delle funzioni principali',
      encryptionDemo: {
        title: '🔐 Crittografia end-to-end',
        description: 'Proteggi i messaggi con l’algoritmo XSalsa20-Poly1305',
        button: 'Demo crittografia'
      },
      identityDemo: {
        title: '🆔 Identità utente',
        description: 'Identità unica basata sulla chiave pubblica Ed25519',
        button: 'Demo identità'
      },
      storageDemo: {
        title: '💾 Archiviazione locale',
        description: 'Archiviazione locale crittografata per messaggi e contatti',
        button: 'Demo archiviazione'
      },
      p2pDemo: {
        title: '🌐 Connessione P2P',
        description: 'Comunicazione diretta WebRTC (richiede due client)',
        button: 'Demo P2P'
      }
    },

    log: {
      title: '📝 Registro di sistema',
      clearButton: 'Cancella registro',
      cleared: 'Registro cancellato'
    },

    settings: {
      title: '⚙️ Impostazioni',
      language: 'Lingua',
      theme: 'Tema',
      notifications: 'Notifiche'
    },

    common: {
      save: 'Salva',
      cancel: 'Annulla',
      confirm: 'Conferma',
      delete: 'Elimina',
      edit: 'Modifica',
      close: 'Chiudi',
      back: 'Indietro',
      next: 'Avanti',
      loading: 'Caricamento...',
      error: 'Errore',
      success: 'Operazione riuscita',
      warning: 'Avviso',
      info: 'Informazione'
    },

    completion: {
      title: 'Identità creata con successo!',
      description: '🎉 Congratulazioni! Hai creato con successo la tua identità VeilConnect. Ora puoi stabilire connessioni P2P sicure con altri utenti.',
      idType: 'Tipo di ID:',
      restartButton: 'Reimposta',
      chatButton: 'Inizia a chattare',
      chatComingSoon: 'La funzione di chat è in fase di sviluppo...'
    },

    chat: {
      needIdentity: 'Identità richiesta',
      generateFirst: 'Genera prima un’identità per iniziare a chattare',
      notConnected: 'Non connesso',
      connecting: 'Connessione in corso',
      connected: 'Connessione P2P stabilita',
      disconnected: 'Connessione P2P persa',
      encrypted: 'Comunicazione crittografata',
      offline: 'Non in linea',
      createConnection: 'Crea',
      joinConnection: 'Unisciti',
      disconnect: 'Disconnetti',
      connect: 'Connetti',
      typePlaceholder: 'Scrivi un messaggio...',
      connectToSend: 'Connettiti a un peer per inviare messaggi',
      shareConnection: 'Condividi connessione',
      shareInstructions: 'Condividi questo ID di connessione con il tuo amico:',
      joinInstructions: 'Inserisci l’ID di connessione del tuo amico:',
      connectionIdPlaceholder: 'Incolla qui l’ID di connessione',
      waitingConnection: 'In attesa che il peer si connetta',
      connectionFailed: 'Impossibile creare la connessione',
      joinFailed: 'Impossibile unirsi alla connessione',
      sendFailed: 'Impossibile inviare il messaggio',
      idCopied: 'ID di connessione copiato negli appunti',
      send: 'Invia',
      p2p: {
        headerTitle: '💬 Chat sicura P2P',
        editNicknameTitle: 'Clicca per cambiare il tuo soprannome (visibile al tuo peer)',
        mePrefix: 'Io: ',
        unnamed: 'Senza nome',
        badgeVerifiedTitle: 'I messaggi sono crittografati end-to-end e hai verificato il codice di sicurezza fuori banda — nessun intermediario',
        badgeVerified: '🔒 Crittografato · Verificato',
        badgeEncryptedTitle: 'I messaggi sono crittografati end-to-end, ma il codice di sicurezza non è stato verificato fuori banda, quindi non si può escludere un intermediario',
        badgePendingSas: '🔒 Crittografato · Verifica il codice di sicurezza',
        badgeHandshaking: '🔄 Connessione in fase di protezione…',
        badgeFailed: '⛔ Verifica non riuscita',
        aboutTitle: 'Informazioni / Privacy e dati locali',
        aboutToggle: 'ⓘ Informazioni',
        sasDialogTitle: '🛡️ Verifica il codice di sicurezza',
        sasDialogBodyLine1: 'Leggetevi a vicenda le cifre qui sotto attraverso un canale affidabile (telefono / di persona).',
        sasDialogBodyLine2: 'Solo se corrispondono non c’è alcun intermediario — questo è il passaggio più importante.',
        peerPrefix: 'Peer: ',
        sasAgree: '✓ Corrispondono, inizia a chattare',
        sasDisagree: '✗ Sono diversi, disconnetti',
        sasBarLabel: '🛡️ Codice di sicurezza',
        sasVerifiedMark: '✓ Corrispondenza verificata',
        createRoomTitle: 'Crea una stanza uno-a-uno rigorosa: una volta che 2 persone si uniscono, chiunque altro con il link viene rifiutato dal server (Stanza piena).',
        createRoomBtn: '🔗 Crea stanza',
        oneToOneNote: '· Uno-a-uno (si blocca dopo l’ingresso di 2)',
        joinRoomBtn: '🔌 Unisciti alla stanza',
        roomCreatedHeading: '🔗 Stanza creata — invia il link al tuo peer; si unirà automaticamente quando lo aprirà in un browser',
        establishingEncrypted: '🔄 Creazione della connessione crittografata in corso…',
        waitingPeerJoin: '● In attesa che il peer si unisca…',
        roomLinkWarning: '⚠️ Il link contiene un token di stanza monouso; invialo tramite un canale affidabile. Dopo la connessione, verifica il “codice di sicurezza” qui sotto con il tuo peer per telefono / di persona prima di chattare — questo è il passaggio fondamentale per escludere un intermediario (incluso un server di segnalazione malevolo).',
        copyLink: '📋 Copia link',
        collapse: 'Comprimi',
        aboutPrivacyTitle: 'I messaggi sono crittografati end-to-end e inviati peer-to-peer; il server si limita a inoltrare l’abbinamento e non gestisce né memorizza alcun messaggio',
        aboutPrivacyBody: '🔒 Il server non memorizza alcuna cronologia delle chat; i messaggi sono crittografati end-to-end e inviati peer-to-peer. La cronologia delle chat risiede solo nel browser di questo dispositivo (cancellata alla chiusura della pagina, mai caricata).',
        clearDataTitle: 'Elimina l’identità e tutti i dati locali salvati in questo browser, tornando allo stato iniziale',
        clearDataBtn: 'Cancella dati locali',
        emptyConnected: 'Canale crittografato stabilito — invia un messaggio per iniziare a chattare.',
        emptyDisconnected: 'Clicca su “🔗 Crea stanza” per generare un link per il tuo peer,\noppure apri un link che ti ha inviato, per iniziare una chat crittografata end-to-end.',
        placeholderWaitingSecure: 'In attesa del canale sicuro…',
        placeholderConfirmSas: 'Verifica prima il codice di sicurezza e clicca su “Corrispondono”…',
        joinRoomDialogTitle: '🔌 Unisciti alla stanza',
        pasteRoomLink: 'Incolla il link della stanza che ti ha inviato il tuo peer:',
        cancel: 'Annulla',
        join: 'Unisciti',
        loadIdentityFailed: 'Impossibile leggere l’identità locale. Aggiorna la pagina e riprova.',
        identityIncomplete: 'L’identità locale è incompleta; impossibile stabilire un canale crittografato. Reimposta la tua identità e riprova.',
        secureChannelFailed: 'Impossibile stabilire il canale crittografato. Riprova.',
        e2eEstablished: '🔐 Canale crittografato end-to-end stabilito. Verifica il codice di sicurezza qui sotto con il tuo peer prima di chattare.',
        e2eEstablishing: '🔐 Creazione del canale crittografato end-to-end in corso…',
        peerVerifyFailed: '⛔ Verifica dell’identità del peer non riuscita — potrebbe essere presente un intermediario. Disconnesso.',
        relayNotice: '🔒 Ti connetterai al tuo peer in modo crittografato tramite un server di inoltro; il tuo IP reale non viene esposto a lui.',
        connectedEstablishing: '✅ Connesso al peer, creazione della crittografia end-to-end in corso…',
        connectFailed: 'Connessione non riuscita. Riprova.',
        peerDisconnected: 'La connessione con il tuo peer è stata chiusa.',
        peerJoinedConnecting: 'Il peer si è unito, connessione in corso…',
        negotiationFailed: 'Negoziazione della connessione non riuscita. Riprova.',
        negotiationError: 'Errore nella negoziazione della connessione. Riprova.',
        peerLeft: 'Il tuo peer è uscito; questa sessione è terminata.',
        signalingError: 'Il servizio di connessione ha riscontrato un errore. Riprova più tardi.',
        roomReadyWaiting: 'Stanza pronta, in attesa che il peer si unisca…',
        joinedConnecting: 'Ti sei unito alla stanza, connessione al peer in corso…',
        serverConnectFailed: 'Impossibile connettersi al server. Controlla la tua rete e riprova.',
        notSecureYet: 'Il canale sicuro non è pronto; impossibile inviare messaggi',
        verifySasFirst: 'Verifica prima il codice di sicurezza con il tuo peer per telefono / di persona e conferma che corrisponda, poi invia i messaggi',
        invalidRoomLink: 'Link della stanza non valido. Dovrebbe assomigliare a https://…/#room=xxx&t=yyy',
        roomCodeBtn: '🔢 Codice stanza',
        roomCodeTitle: 'Connettiti con un codice stanza concordato (nessun link lungo da inviare)',
        roomCodeDialogTitle: 'Connetti tramite codice stanza',
        roomCodeDialogBody: 'Concordate lo stesso codice stanza: una persona tocca Crea, l’altra tocca Unisciti. Non è necessario inviare il lungo link della stanza.',
        roomCodePlaceholder: 'Inserisci il codice stanza concordato (min 8 chars)',
        roomCodeSecurityHint: 'Un codice stanza è solo un’etichetta di incontro e può essere indovinato; la protezione contro l’intermediario deriva comunque dalla verifica del codice di sicurezza / codice di abbinamento dopo la connessione — assicurati di verificare.',
        roomCodeCreateBtn: 'Crea stanza',
        roomCodeJoinBtn: 'Unisciti alla stanza',
        roomCodeTooShort: 'Codice stanza troppo corto (min 8 chars)',
        roomCodeShareLabel: 'Comunica al tuo peer questo codice stanza:',
        roomCodeShareHint: 'Fagli aprire “Codice stanza”, toccare Unisciti e inserire lo stesso codice. Ricordati di verificare il codice di sicurezza/abbinamento.',
        disconnectedManual: 'Disconnesso',
        copiedToClipboard: 'Copiato negli appunti',
        relayNotReady: 'Il server di inoltro non è pronto e la connessione potrebbe non riuscire. Se rimane irraggiungibile, contatta l’amministratore del sito.',
        sasMismatch: 'Codice di sicurezza non corrispondente — possibile intermediario. Disconnesso.',
        nicknameUpdated: 'Soprannome aggiornato',
        nicknameUpdateFailed: 'Impossibile aggiornare il soprannome',
        sasConfirmedToast: 'Codice di sicurezza confermato come corrispondente — puoi iniziare a chattare',
        setNicknamePrompt: 'Imposta il tuo soprannome (visibile al tuo peer):',
        clearDataConfirm: 'Cancellare tutti i dati locali su questo dispositivo?\n\nQuesto elimina l’identità crittografata e tutti i dati locali salvati in questo browser e non può essere annullato (il server comunque non memorizza nulla). Successivamente tornerai a “Imposta passphrase” e ricomincerai da capo.',
        pairUseToggle: 'Usa un codice di abbinamento (verifica automatica, nessun controllo manuale del codice di sicurezza)',
        pairCodeLabel: 'Codice di abbinamento',
        pairShareHint: '⚠️ Condividi il codice di abbinamento con il tuo peer attraverso un canale affidabile DIVERSO (di persona / telefono / un’altra app crittografata) — mai attraverso lo stesso canale del link sopra, altrimenti non offre alcuna protezione.',
        pairEnterTitle: '🔑 Inserisci il codice di abbinamento',
        pairEnterBody: 'Il tuo peer ha abilitato la verifica con codice di abbinamento. Inserisci il codice che ti ha dato attraverso un canale affidabile per confermare automaticamente che non c’è alcun intermediario.',
        pairEnterPlaceholder: 'es. ABCD-1234-EFGH-…',
        pairConfirmBtn: 'Conferma',
        pairVerifyingBadge: '🔒 Crittografato · verifica del codice di abbinamento',
        pairVerifiedBadge: '🔐 Codice di abbinamento verificato',
        pairVerifiedMark: '✓ Codice di abbinamento verificato (anti-MITM automatico)',
        pairBarLabel: 'Codice di abbinamento:',
        pairFailed: 'Codice di abbinamento non corrispondente o intermediario — disconnesso',
        pairMissingCode: 'Inserisci prima il codice di abbinamento completo (quello generato dal sistema)',
        pairTimedOut: 'Verifica dell’abbinamento scaduta — disconnesso (controlla che entrambe le parti usino lo stesso codice)',
        pairJoinOptional: 'Codice di abbinamento (facoltativo; compilalo se il tuo peer lo ha abilitato — verifica automatica, nessun controllo manuale del codice di sicurezza)',
        blobShareBtn: '📤 Condividi un file (link)',
        blobShareTitle: 'Cripta e carica un file, ottieni un link di condivisione (il destinatario non deve essere in linea — scarica tramite il link)',
        blobUploading: 'Crittografia e caricamento in corso…',
        blobPasswordPrompt: 'Facoltativo: imposta una password di download (lascia vuoto = il solo link è sufficiente). Se impostata, il destinatario necessita di link + password.',
        blobReady: '✅ Link di condivisione creato (file crittografato e caricato)',
        blobFailed: 'Caricamento del file non riuscito',
        blobTooLarge: 'File troppo grande: il caricamento singolo ospitato è limitato a ~95MB (limite del corpo della richiesta di 100MB di Cloudflare). I file più grandi richiedono un caricamento multipart (non ancora supportato).',
        blobLinkHeading: '📦 Link di condivisione del file (contiene la chiave di decrittografia — invialo tramite un canale affidabile)',
        blobLinkHint: '⚠️ Il link contiene la chiave di decrittografia; il destinatario può scaricare e decrittografare senza essere in linea. Scade per impostazione predefinita in 24h.',
        file: {
          attachTitle: 'Invia un file o una foto',
          busy: 'Un file è già in fase di invio — attendi che termini prima di inviarne un altro',
          tooLarge: 'Il file supera il limite di 100 MB',
          readFailed: 'Impossibile leggere il file',
          offerFailed: 'Impossibile inviare il file',
          sending: 'Invio in corso',
          receiving: 'Ricezione in corso',
          completed: 'Completato',
          failed: 'Trasferimento non riuscito',
          cancelled: 'Annullato',
          verifyFailed: 'Verifica del file non riuscita (dimensione o hash non corrispondenti); scartato',
          incoming: 'Ricezione di un file in corso…',
          sent: 'Inviato',
          received: 'Ricevuto',
          download: 'Scarica',
          cancel: 'Annulla',
          imageAlt: 'Immagine ricevuta'
        }
      }
    }
  },
  'hi': {
    appTitle: 'VeilConnect',
    appSubtitle: 'P2P एन्क्रिप्टेड चैट',
    appDescription: 'एक P2P एंड-टू-एंड एन्क्रिप्टेड चैट एप्लिकेशन जो केंद्रीय सर्वर पर निर्भर हुए बिना आपके संचार की गोपनीयता और सुरक्षा सुनिश्चित करता है।',

    welcome: {
      title: 'VeilConnect',
      subtitle: 'P2P एन्क्रिप्टेड चैट',
      description: 'VeilConnect में आपका स्वागत है! यह एक P2P एंड-टू-एंड एन्क्रिप्टेड चैट एप्लिकेशन है जो केंद्रीय सर्वर पर निर्भर हुए बिना आपके संचार की गोपनीयता और सुरक्षा सुनिश्चित करता है।',
      features: {
        title: '🔐 मुख्य विशेषताएँ',
        encryption: '• एंड-टू-एंड एन्क्रिप्शन (XSalsa20-Poly1305)',
        p2p: '• P2P सीधा संचार (WebRTC)',
        customId: '• कस्टम यूज़र ID',
        fileTransfer: '• फ़ाइल ट्रांसफर समर्थन',
        decentralized: '• पूरी तरह विकेंद्रीकृत'
      },
      startButton: 'शुरू करें'
    },

    identity: {
      generateButton: 'नई पहचान बनाएँ',
      clearButton: 'पहचान हटाएँ',
      status: {
        active: '✅ पहचान सक्रिय',
        inactive: 'ℹ️ कृपया पहले पहचान बनाएँ',
        pleaseGenerate: 'कृपया पहले पहचान बनाएँ'
      },
      userId: 'यूज़र ID:',
      nickname: 'उपनाम:',
      publicKey: 'सार्वजनिक कुंजी:',
      privateKey: 'निजी कुंजी:'
    },

    encryption: {
      title: '🔐 एन्क्रिप्शन परीक्षण',
      inputPlaceholder: 'एन्क्रिप्ट करने के लिए टेक्स्ट दर्ज करें',
      testButton: 'एन्क्रिप्शन परीक्षण करें',
      original: 'मूल:',
      encrypted: 'एन्क्रिप्टेड:',
      decrypted: 'डिक्रिप्टेड:',
      success: '✅ एन्क्रिप्शन परीक्षण सफल',
      error: 'एन्क्रिप्शन परीक्षण विफल',
      pleaseGenerateIdentity: 'कृपया पहले पहचान बनाएँ',
      pleaseEnterText: 'कृपया एन्क्रिप्ट करने के लिए टेक्स्ट दर्ज करें'
    },

    system: {
      title: '📊 सिस्टम स्थिति',
      identityStatus: 'पहचान स्थिति:',
      messageCount: 'संदेश संख्या:',
      contactCount: 'संपर्क संख्या:',
      uptime: 'अपटाइम:',
      seconds: 'सेकंड'
    },

    features: {
      title: '🚀 मुख्य विशेषता डेमो',
      encryptionDemo: {
        title: '🔐 एंड-टू-एंड एन्क्रिप्शन',
        description: 'XSalsa20-Poly1305 एल्गोरिदम से सुरक्षित संदेश',
        button: 'एन्क्रिप्शन डेमो'
      },
      identityDemo: {
        title: '🆔 यूज़र पहचान',
        description: 'Ed25519 सार्वजनिक कुंजी पर आधारित अद्वितीय पहचान',
        button: 'पहचान डेमो'
      },
      storageDemo: {
        title: '💾 स्थानीय भंडारण',
        description: 'संदेशों और संपर्कों के लिए स्थानीय एन्क्रिप्टेड भंडारण',
        button: 'भंडारण डेमो'
      },
      p2pDemo: {
        title: '🌐 P2P कनेक्शन',
        description: 'WebRTC सीधा संचार (दो क्लाइंट आवश्यक)',
        button: 'P2P डेमो'
      }
    },

    log: {
      title: '📝 सिस्टम लॉग',
      clearButton: 'लॉग साफ़ करें',
      cleared: 'लॉग साफ़ किया गया'
    },

    settings: {
      title: '⚙️ सेटिंग्स',
      language: 'भाषा',
      theme: 'थीम',
      notifications: 'सूचनाएँ'
    },

    common: {
      save: 'सहेजें',
      cancel: 'रद्द करें',
      confirm: 'पुष्टि करें',
      delete: 'हटाएँ',
      edit: 'संपादित करें',
      close: 'बंद करें',
      back: 'वापस',
      next: 'अगला',
      loading: 'लोड हो रहा है...',
      error: 'त्रुटि',
      success: 'सफल',
      warning: 'चेतावनी',
      info: 'जानकारी'
    },

    completion: {
      title: 'पहचान सफलतापूर्वक बनाई गई!',
      description: '🎉 बधाई हो! आपने सफलतापूर्वक अपनी VeilConnect पहचान बना ली है। अब आप अन्य उपयोगकर्ताओं के साथ सुरक्षित P2P कनेक्शन स्थापित कर सकते हैं।',
      idType: 'ID प्रकार:',
      restartButton: 'रीसेट करें',
      chatButton: 'चैट शुरू करें',
      chatComingSoon: 'चैट सुविधा विकासाधीन है...'
    },

    chat: {
      needIdentity: 'पहचान आवश्यक',
      generateFirst: 'चैट शुरू करने के लिए कृपया पहले एक पहचान बनाएँ',
      notConnected: 'कनेक्ट नहीं है',
      connecting: 'कनेक्ट हो रहा है',
      connected: 'P2P कनेक्शन स्थापित',
      disconnected: 'P2P कनेक्शन टूट गया',
      encrypted: 'एन्क्रिप्टेड संचार',
      offline: 'ऑफ़लाइन',
      createConnection: 'बनाएँ',
      joinConnection: 'शामिल हों',
      disconnect: 'डिस्कनेक्ट करें',
      connect: 'कनेक्ट करें',
      typePlaceholder: 'एक संदेश लिखें...',
      connectToSend: 'संदेश भेजने के लिए किसी पीयर से कनेक्ट करें',
      shareConnection: 'कनेक्शन साझा करें',
      shareInstructions: 'इस कनेक्शन ID को अपने मित्र के साथ साझा करें:',
      joinInstructions: 'अपने मित्र से मिली कनेक्शन ID दर्ज करें:',
      connectionIdPlaceholder: 'कनेक्शन ID यहाँ पेस्ट करें',
      waitingConnection: 'पीयर के कनेक्ट होने की प्रतीक्षा है',
      connectionFailed: 'कनेक्शन बनाने में विफल',
      joinFailed: 'कनेक्शन में शामिल होने में विफल',
      sendFailed: 'संदेश भेजने में विफल',
      idCopied: 'कनेक्शन ID क्लिपबोर्ड पर कॉपी की गई',
      send: 'भेजें',
      p2p: {
        headerTitle: '💬 P2P सुरक्षित चैट',
        editNicknameTitle: 'अपना उपनाम बदलने के लिए क्लिक करें (आपके पीयर को दिखाई देता है)',
        mePrefix: 'मैं: ',
        unnamed: 'अनाम',
        badgeVerifiedTitle: 'संदेश एंड-टू-एंड एन्क्रिप्टेड हैं, और आपने सुरक्षा कोड को बाहरी चैनल से सत्यापित किया है — कोई मैन-इन-द-मिडल नहीं',
        badgeVerified: '🔒 एन्क्रिप्टेड · सत्यापित',
        badgeEncryptedTitle: 'संदेश एंड-टू-एंड एन्क्रिप्टेड हैं, लेकिन सुरक्षा कोड को बाहरी चैनल से सत्यापित नहीं किया गया है, इसलिए मैन-इन-द-मिडल को नकारा नहीं जा सकता',
        badgePendingSas: '🔒 एन्क्रिप्टेड · सुरक्षा कोड सत्यापित करें',
        badgeHandshaking: '🔄 कनेक्शन सुरक्षित किया जा रहा है…',
        badgeFailed: '⛔ सत्यापन विफल',
        aboutTitle: 'परिचय / गोपनीयता और स्थानीय डेटा',
        aboutToggle: 'ⓘ परिचय',
        sasDialogTitle: '🛡️ सुरक्षा कोड सत्यापित करें',
        sasDialogBodyLine1: 'नीचे दिए गए अंक एक-दूसरे को किसी विश्वसनीय चैनल (फ़ोन / व्यक्तिगत रूप से) पर पढ़कर सुनाएँ।',
        sasDialogBodyLine2: 'केवल यदि वे मेल खाते हैं तभी कोई मैन-इन-द-मिडल नहीं है — यह सबसे महत्वपूर्ण कदम है।',
        peerPrefix: 'पीयर: ',
        sasAgree: '✓ वे मेल खाते हैं, चैट शुरू करें',
        sasDisagree: '✗ वे भिन्न हैं, डिस्कनेक्ट करें',
        sasBarLabel: '🛡️ सुरक्षा कोड',
        sasVerifiedMark: '✓ सत्यापित मेल',
        createRoomTitle: 'एक सख्त वन-टू-वन रूम बनाएँ: जैसे ही 2 लोग शामिल होते हैं, लिंक वाले किसी भी अन्य व्यक्ति को सर्वर द्वारा अस्वीकार कर दिया जाता है (रूम भरा हुआ)।',
        createRoomBtn: '🔗 रूम बनाएँ',
        oneToOneNote: '· वन-टू-वन (2 के शामिल होने पर लॉक हो जाता है)',
        joinRoomBtn: '🔌 रूम में शामिल हों',
        roomCreatedHeading: '🔗 रूम बनाया गया — लिंक अपने पीयर को भेजें; जब वे इसे ब्राउज़र में खोलते हैं तो यह अपने आप शामिल हो जाता है',
        establishingEncrypted: '🔄 एन्क्रिप्टेड कनेक्शन स्थापित किया जा रहा है…',
        waitingPeerJoin: '● पीयर के शामिल होने की प्रतीक्षा है…',
        roomLinkWarning: '⚠️ लिंक में एक बार उपयोग होने वाला रूम टोकन होता है; इसे किसी विश्वसनीय चैनल पर भेजें। कनेक्ट होने के बाद, चैट करने से पहले अपने पीयर के साथ नीचे दिए गए “सुरक्षा कोड” को फ़ोन / व्यक्तिगत रूप से सत्यापित करें — मैन-इन-द-मिडल (दुर्भावनापूर्ण सिग्नलिंग सर्वर सहित) को नकारने के लिए यह प्रमुख कदम है।',
        copyLink: '📋 लिंक कॉपी करें',
        collapse: 'समेटें',
        aboutPrivacyTitle: 'संदेश एंड-टू-एंड एन्क्रिप्टेड हैं और पीयर-टू-पीयर भेजे जाते हैं; सर्वर केवल पेयरिंग रिले करता है और कभी भी किसी संदेश को संभालता या संग्रहीत नहीं करता',
        aboutPrivacyBody: '🔒 सर्वर कोई चैट इतिहास संग्रहीत नहीं करता; संदेश एंड-टू-एंड एन्क्रिप्टेड हैं और पीयर-टू-पीयर भेजे जाते हैं। चैट इतिहास केवल इस डिवाइस के ब्राउज़र में रहता है (पेज बंद होने पर साफ़ हो जाता है, कभी अपलोड नहीं होता)।',
        clearDataTitle: 'इस ब्राउज़र में सहेजी गई पहचान और सभी स्थानीय डेटा हटाएँ, और प्रारंभिक स्थिति पर लौटें',
        clearDataBtn: 'स्थानीय डेटा साफ़ करें',
        emptyConnected: 'एन्क्रिप्टेड चैनल स्थापित — चैट शुरू करने के लिए एक संदेश भेजें।',
        emptyDisconnected: 'अपने पीयर के लिए लिंक बनाने हेतु “🔗 रूम बनाएँ” पर क्लिक करें,\nया एंड-टू-एंड एन्क्रिप्टेड चैट शुरू करने के लिए उनके द्वारा भेजा गया लिंक खोलें।',
        placeholderWaitingSecure: 'सुरक्षित चैनल की प्रतीक्षा है…',
        placeholderConfirmSas: 'पहले सुरक्षा कोड सत्यापित करें और “वे मेल खाते हैं” पर क्लिक करें…',
        joinRoomDialogTitle: '🔌 रूम में शामिल हों',
        pasteRoomLink: 'अपने पीयर द्वारा भेजा गया रूम लिंक पेस्ट करें:',
        cancel: 'रद्द करें',
        join: 'शामिल हों',
        loadIdentityFailed: 'स्थानीय पहचान पढ़ने में विफल। कृपया पेज को रिफ़्रेश करें और पुनः प्रयास करें।',
        identityIncomplete: 'स्थानीय पहचान अधूरी है; एन्क्रिप्टेड चैनल स्थापित नहीं किया जा सकता। कृपया अपनी पहचान रीसेट करें और पुनः प्रयास करें।',
        secureChannelFailed: 'एन्क्रिप्टेड चैनल स्थापित करने में विफल। कृपया पुनः प्रयास करें।',
        e2eEstablished: '🔐 एंड-टू-एंड एन्क्रिप्टेड चैनल स्थापित। चैट करने से पहले अपने पीयर के साथ नीचे दिया गया सुरक्षा कोड सत्यापित करें।',
        e2eEstablishing: '🔐 एंड-टू-एंड एन्क्रिप्टेड चैनल स्थापित किया जा रहा है…',
        peerVerifyFailed: '⛔ पीयर पहचान सत्यापन विफल — मैन-इन-द-मिडल मौजूद हो सकता है। डिस्कनेक्ट कर दिया गया।',
        relayNotice: '🔒 आप एक रिले सर्वर के माध्यम से एन्क्रिप्टेड रूप से अपने पीयर से कनेक्ट होंगे; आपका असली IP उन्हें उजागर नहीं होता।',
        connectedEstablishing: '✅ पीयर से कनेक्ट हो गया, एंड-टू-एंड एन्क्रिप्शन स्थापित किया जा रहा है…',
        connectFailed: 'कनेक्ट करने में विफल। कृपया पुनः प्रयास करें।',
        peerDisconnected: 'आपके पीयर से कनेक्शन बंद कर दिया गया है।',
        peerJoinedConnecting: 'पीयर शामिल हुआ, कनेक्ट हो रहा है…',
        negotiationFailed: 'कनेक्शन नेगोशिएशन विफल। कृपया पुनः प्रयास करें।',
        negotiationError: 'कनेक्शन नेगोशिएशन में त्रुटि। कृपया पुनः प्रयास करें।',
        peerLeft: 'आपका पीयर चला गया; यह सत्र समाप्त हो गया है।',
        signalingError: 'कनेक्शन सेवा में त्रुटि हुई। कृपया बाद में पुनः प्रयास करें।',
        roomReadyWaiting: 'रूम तैयार है, पीयर के शामिल होने की प्रतीक्षा है…',
        joinedConnecting: 'रूम में शामिल हो गया, पीयर से कनेक्ट हो रहा है…',
        serverConnectFailed: 'सर्वर से कनेक्ट नहीं हो सका। अपना नेटवर्क जाँचें और पुनः प्रयास करें।',
        notSecureYet: 'सुरक्षित चैनल तैयार नहीं है; संदेश नहीं भेजे जा सकते',
        verifySasFirst: 'पहले अपने पीयर के साथ फ़ोन / व्यक्तिगत रूप से सुरक्षा कोड सत्यापित करें और पुष्टि करें कि वह मेल खाता है, फिर संदेश भेजें',
        invalidRoomLink: 'अमान्य रूम लिंक। यह https://…/#room=xxx&t=yyy जैसा दिखना चाहिए',
        roomCodeBtn: '🔢 रूम कोड',
        roomCodeTitle: 'एक तय किए गए रूम कोड से कनेक्ट करें (भेजने के लिए कोई लंबा लिंक नहीं)',
        roomCodeDialogTitle: 'रूम कोड से कनेक्ट करें',
        roomCodeDialogBody: 'एक ही रूम कोड पर सहमत हों: एक व्यक्ति बनाएँ पर टैप करता है, दूसरा शामिल हों पर टैप करता है। लंबा रूम लिंक भेजने की आवश्यकता नहीं।',
        roomCodePlaceholder: 'तय किया गया रूम कोड दर्ज करें (न्यूनतम 8 chars)',
        roomCodeSecurityHint: 'रूम कोड केवल एक मिलन-स्थल लेबल है और इसका अनुमान लगाया जा सकता है; MITM से सुरक्षा अब भी कनेक्ट होने के बाद सुरक्षा कोड / पेयरिंग कोड सत्यापित करने से मिलती है — अवश्य सत्यापित करें।',
        roomCodeCreateBtn: 'रूम बनाएँ',
        roomCodeJoinBtn: 'रूम में शामिल हों',
        roomCodeTooShort: 'रूम कोड बहुत छोटा है (न्यूनतम 8 chars)',
        roomCodeShareLabel: 'अपने पीयर को यह रूम कोड बताएँ:',
        roomCodeShareHint: 'उनसे “रूम कोड” खोलने, शामिल हों पर टैप करने, और वही कोड दर्ज करने को कहें। सुरक्षा/पेयरिंग कोड सत्यापित करना न भूलें।',
        disconnectedManual: 'डिस्कनेक्ट कर दिया गया',
        copiedToClipboard: 'क्लिपबोर्ड पर कॉपी किया गया',
        relayNotReady: 'रिले सर्वर तैयार नहीं है और कनेक्शन विफल हो सकता है। यदि यह अनुपलब्ध बना रहे, तो साइट प्रशासक से संपर्क करें।',
        sasMismatch: 'सुरक्षा कोड मेल नहीं खाता — संभावित मैन-इन-द-मिडल। डिस्कनेक्ट कर दिया गया।',
        nicknameUpdated: 'उपनाम अपडेट किया गया',
        nicknameUpdateFailed: 'उपनाम अपडेट करने में विफल',
        sasConfirmedToast: 'सुरक्षा कोड मेल खाने के रूप में पुष्ट — आप चैट शुरू कर सकते हैं',
        setNicknamePrompt: 'अपना उपनाम सेट करें (आपके पीयर को दिखाई देता है):',
        clearDataConfirm: 'इस डिवाइस पर सभी स्थानीय डेटा साफ़ करें?\n\nयह एन्क्रिप्टेड पहचान और इस ब्राउज़र में सहेजे गए सभी स्थानीय डेटा को हटा देता है, और इसे पूर्ववत नहीं किया जा सकता (वैसे भी सर्वर कुछ भी संग्रहीत नहीं करता)। इसके बाद आप “पासफ़्रेज़ सेट करें” पर लौटते हैं और फिर से शुरू करते हैं।',
        pairUseToggle: 'पेयरिंग कोड का उपयोग करें (स्वतः-सत्यापन, मैन्युअल सुरक्षा-कोड जाँच नहीं)',
        pairCodeLabel: 'पेयरिंग कोड',
        pairShareHint: '⚠️ पेयरिंग कोड को अपने पीयर के साथ एक भिन्न विश्वसनीय चैनल (व्यक्तिगत रूप से / फ़ोन / किसी अन्य एन्क्रिप्टेड ऐप) पर साझा करें — कभी भी ऊपर दिए गए लिंक के समान चैनल से नहीं, अन्यथा यह कोई सुरक्षा नहीं देता।',
        pairEnterTitle: '🔑 पेयरिंग कोड दर्ज करें',
        pairEnterBody: 'आपके पीयर ने पेयरिंग-कोड सत्यापन सक्षम किया है। उनके द्वारा किसी विश्वसनीय चैनल पर दिया गया कोड दर्ज करें ताकि स्वतः पुष्टि हो जाए कि कोई मैन-इन-द-मिडल नहीं है।',
        pairEnterPlaceholder: 'उदा. ABCD-1234-EFGH-…',
        pairConfirmBtn: 'पुष्टि करें',
        pairVerifyingBadge: '🔒 एन्क्रिप्टेड · पेयरिंग कोड सत्यापित किया जा रहा है',
        pairVerifiedBadge: '🔐 पेयरिंग कोड सत्यापित',
        pairVerifiedMark: '✓ पेयरिंग कोड सत्यापित (स्वतः एंटी-MITM)',
        pairBarLabel: 'पेयरिंग कोड:',
        pairFailed: 'पेयरिंग कोड मेल नहीं खाता या मैन-इन-द-मिडल — डिस्कनेक्ट कर दिया गया',
        pairMissingCode: 'पहले पूरा पेयरिंग कोड (सिस्टम-जनित वाला) दर्ज करें',
        pairTimedOut: 'पेयरिंग सत्यापन का समय समाप्त हो गया — डिस्कनेक्ट कर दिया गया (जाँचें कि दोनों पक्ष एक ही कोड का उपयोग कर रहे हैं)',
        pairJoinOptional: 'पेयरिंग कोड (वैकल्पिक; यदि आपके पीयर ने इसे सक्षम किया है तो भरें — स्वतः सत्यापित करता है, मैन्युअल सुरक्षा-कोड जाँच नहीं)',
        blobShareBtn: '📤 एक फ़ाइल साझा करें (लिंक)',
        blobShareTitle: 'एक फ़ाइल एन्क्रिप्ट और अपलोड करें, एक साझा लिंक प्राप्त करें (प्राप्तकर्ता को ऑनलाइन होने की आवश्यकता नहीं — वे लिंक से डाउनलोड करते हैं)',
        blobUploading: 'एन्क्रिप्ट और अपलोड किया जा रहा है…',
        blobPasswordPrompt: 'वैकल्पिक: एक डाउनलोड पासवर्ड सेट करें (खाली छोड़ें = अकेला लिंक पर्याप्त है)। यदि सेट है, तो प्राप्तकर्ता को लिंक + पासवर्ड की आवश्यकता होगी।',
        blobReady: '✅ साझा लिंक बनाया गया (फ़ाइल एन्क्रिप्ट और अपलोड की गई)',
        blobFailed: 'फ़ाइल अपलोड विफल',
        blobTooLarge: 'फ़ाइल बहुत बड़ी है: होस्टेड एकल अपलोड ~95MB तक सीमित है (Cloudflare 100MB रिक्वेस्ट-बॉडी सीमा)। बड़ी फ़ाइलों के लिए मल्टीपार्ट अपलोड चाहिए (अभी समर्थित नहीं)।',
        blobLinkHeading: '📦 फ़ाइल साझा लिंक (डिक्रिप्शन कुंजी शामिल है — किसी विश्वसनीय चैनल से भेजें)',
        blobLinkHint: '⚠️ लिंक में डिक्रिप्शन कुंजी होती है; प्राप्तकर्ता बिना ऑनलाइन हुए डाउनलोड और डिक्रिप्ट कर सकता है। डिफ़ॉल्ट रूप से 24h में समाप्त हो जाता है।',
        file: {
          attachTitle: 'एक फ़ाइल या फ़ोटो भेजें',
          busy: 'एक फ़ाइल पहले से भेजी जा रही है — दूसरी भेजने से पहले इसके पूरा होने की प्रतीक्षा करें',
          tooLarge: 'फ़ाइल 100 MB की सीमा से अधिक है',
          readFailed: 'फ़ाइल पढ़ने में विफल',
          offerFailed: 'फ़ाइल भेजने में विफल',
          sending: 'भेजा जा रहा है',
          receiving: 'प्राप्त हो रहा है',
          completed: 'पूर्ण',
          failed: 'ट्रांसफर विफल',
          cancelled: 'रद्द किया गया',
          verifyFailed: 'फ़ाइल सत्यापन विफल (आकार या हैश मेल नहीं खाता); छोड़ दिया गया',
          incoming: 'एक फ़ाइल प्राप्त हो रही है…',
          sent: 'भेजा गया',
          received: 'प्राप्त हुआ',
          download: 'डाउनलोड करें',
          cancel: 'रद्द करें',
          imageAlt: 'प्राप्त छवि'
        }
      }
    }
  },
  'th': {
    appTitle: 'VeilConnect',
    appSubtitle: 'แชตเข้ารหัสแบบ P2P',
    appDescription: 'แอปแชตเข้ารหัสแบบ end-to-end ผ่าน P2P ที่รับประกันความเป็นส่วนตัวและความปลอดภัยในการสื่อสารของคุณ โดยไม่ต้องพึ่งพาเซิร์ฟเวอร์ส่วนกลาง',

    welcome: {
      title: 'VeilConnect',
      subtitle: 'แชตเข้ารหัสแบบ P2P',
      description: 'ยินดีต้อนรับสู่ VeilConnect! นี่คือแอปแชตเข้ารหัสแบบ end-to-end ผ่าน P2P ที่รับประกันความเป็นส่วนตัวและความปลอดภัยในการสื่อสารของคุณ โดยไม่ต้องพึ่งพาเซิร์ฟเวอร์ส่วนกลาง',
      features: {
        title: '🔐 คุณสมบัติหลัก',
        encryption: '• การเข้ารหัสแบบ end-to-end (XSalsa20-Poly1305)',
        p2p: '• การสื่อสารโดยตรงแบบ P2P (WebRTC)',
        customId: '• ID ผู้ใช้ที่กำหนดเองได้',
        fileTransfer: '• รองรับการถ่ายโอนไฟล์',
        decentralized: '• กระจายศูนย์อย่างสมบูรณ์'
      },
      startButton: 'เริ่มต้นใช้งาน'
    },

    identity: {
      generateButton: 'สร้างตัวตนใหม่',
      clearButton: 'ล้างตัวตน',
      status: {
        active: '✅ ตัวตนพร้อมใช้งาน',
        inactive: 'ℹ️ กรุณาสร้างตัวตนก่อน',
        pleaseGenerate: 'กรุณาสร้างตัวตนก่อน'
      },
      userId: 'ID ผู้ใช้:',
      nickname: 'ชื่อเล่น:',
      publicKey: 'กุญแจสาธารณะ:',
      privateKey: 'กุญแจส่วนตัว:'
    },

    encryption: {
      title: '🔐 ทดสอบการเข้ารหัส',
      inputPlaceholder: 'ป้อนข้อความที่จะเข้ารหัส',
      testButton: 'ทดสอบการเข้ารหัส',
      original: 'ต้นฉบับ:',
      encrypted: 'เข้ารหัสแล้ว:',
      decrypted: 'ถอดรหัสแล้ว:',
      success: '✅ ทดสอบการเข้ารหัสสำเร็จ',
      error: 'ทดสอบการเข้ารหัสล้มเหลว',
      pleaseGenerateIdentity: 'กรุณาสร้างตัวตนก่อน',
      pleaseEnterText: 'กรุณาป้อนข้อความที่จะเข้ารหัส'
    },

    system: {
      title: '📊 สถานะระบบ',
      identityStatus: 'สถานะตัวตน:',
      messageCount: 'จำนวนข้อความ:',
      contactCount: 'จำนวนผู้ติดต่อ:',
      uptime: 'เวลาทำงาน:',
      seconds: 'วินาที'
    },

    features: {
      title: '🚀 สาธิตคุณสมบัติหลัก',
      encryptionDemo: {
        title: '🔐 การเข้ารหัสแบบ end-to-end',
        description: 'รักษาความปลอดภัยข้อความด้วยอัลกอริทึม XSalsa20-Poly1305',
        button: 'สาธิตการเข้ารหัส'
      },
      identityDemo: {
        title: '🆔 ตัวตนผู้ใช้',
        description: 'ตัวตนเฉพาะตัวที่อิงกับกุญแจสาธารณะ Ed25519',
        button: 'สาธิตตัวตน'
      },
      storageDemo: {
        title: '💾 ที่จัดเก็บในเครื่อง',
        description: 'จัดเก็บข้อความและผู้ติดต่อแบบเข้ารหัสไว้ในเครื่อง',
        button: 'สาธิตที่จัดเก็บ'
      },
      p2pDemo: {
        title: '🌐 การเชื่อมต่อ P2P',
        description: 'การสื่อสารโดยตรงผ่าน WebRTC (ต้องใช้สองไคลเอนต์)',
        button: 'สาธิต P2P'
      }
    },

    log: {
      title: '📝 บันทึกระบบ',
      clearButton: 'ล้างบันทึก',
      cleared: 'ล้างบันทึกแล้ว'
    },

    settings: {
      title: '⚙️ การตั้งค่า',
      language: 'ภาษา',
      theme: 'ธีม',
      notifications: 'การแจ้งเตือน'
    },

    common: {
      save: 'บันทึก',
      cancel: 'ยกเลิก',
      confirm: 'ยืนยัน',
      delete: 'ลบ',
      edit: 'แก้ไข',
      close: 'ปิด',
      back: 'ย้อนกลับ',
      next: 'ถัดไป',
      loading: 'กำลังโหลด...',
      error: 'ข้อผิดพลาด',
      success: 'สำเร็จ',
      warning: 'คำเตือน',
      info: 'ข้อมูล'
    },

    completion: {
      title: 'สร้างตัวตนสำเร็จ!',
      description: '🎉 ยินดีด้วย! คุณสร้างตัวตน VeilConnect ของคุณสำเร็จแล้ว ตอนนี้คุณสามารถสร้างการเชื่อมต่อ P2P ที่ปลอดภัยกับผู้ใช้คนอื่นได้แล้ว',
      idType: 'ประเภท ID:',
      restartButton: 'รีเซ็ต',
      chatButton: 'เริ่มแชต',
      chatComingSoon: 'คุณสมบัติแชตกำลังอยู่ระหว่างการพัฒนา...'
    },

    chat: {
      needIdentity: 'ต้องมีตัวตน',
      generateFirst: 'กรุณาสร้างตัวตนก่อนเพื่อเริ่มแชต',
      notConnected: 'ยังไม่ได้เชื่อมต่อ',
      connecting: 'กำลังเชื่อมต่อ',
      connected: 'สร้างการเชื่อมต่อ P2P แล้ว',
      disconnected: 'การเชื่อมต่อ P2P หลุด',
      encrypted: 'การสื่อสารที่เข้ารหัส',
      offline: 'ออฟไลน์',
      createConnection: 'สร้าง',
      joinConnection: 'เข้าร่วม',
      disconnect: 'ตัดการเชื่อมต่อ',
      connect: 'เชื่อมต่อ',
      typePlaceholder: 'พิมพ์ข้อความ...',
      connectToSend: 'เชื่อมต่อกับเพื่อนเพื่อส่งข้อความ',
      shareConnection: 'แชร์การเชื่อมต่อ',
      shareInstructions: 'แชร์ ID การเชื่อมต่อนี้กับเพื่อนของคุณ:',
      joinInstructions: 'ป้อน ID การเชื่อมต่อจากเพื่อนของคุณ:',
      connectionIdPlaceholder: 'วาง ID การเชื่อมต่อที่นี่',
      waitingConnection: 'กำลังรอเพื่อนเชื่อมต่อ',
      connectionFailed: 'สร้างการเชื่อมต่อล้มเหลว',
      joinFailed: 'เข้าร่วมการเชื่อมต่อล้มเหลว',
      sendFailed: 'ส่งข้อความล้มเหลว',
      idCopied: 'คัดลอก ID การเชื่อมต่อไปยังคลิปบอร์ดแล้ว',
      send: 'ส่ง',
      p2p: {
        headerTitle: '💬 แชตปลอดภัยแบบ P2P',
        editNicknameTitle: 'คลิกเพื่อเปลี่ยนชื่อเล่นของคุณ (เพื่อนของคุณมองเห็น)',
        mePrefix: 'ฉัน: ',
        unnamed: 'ไม่มีชื่อ',
        badgeVerifiedTitle: 'ข้อความถูกเข้ารหัสแบบ end-to-end และคุณได้ยืนยันรหัสความปลอดภัยผ่านช่องทางภายนอกแล้ว — ไม่มีคนกลางดักฟัง',
        badgeVerified: '🔒 เข้ารหัส · ยืนยันแล้ว',
        badgeEncryptedTitle: 'ข้อความถูกเข้ารหัสแบบ end-to-end แต่ยังไม่ได้ยืนยันรหัสความปลอดภัยผ่านช่องทางภายนอก จึงไม่อาจตัดความเป็นไปได้ที่จะมีคนกลางดักฟัง',
        badgePendingSas: '🔒 เข้ารหัส · ยืนยันรหัสความปลอดภัย',
        badgeHandshaking: '🔄 กำลังทำให้การเชื่อมต่อปลอดภัย…',
        badgeFailed: '⛔ การยืนยันล้มเหลว',
        aboutTitle: 'เกี่ยวกับ / ความเป็นส่วนตัวและข้อมูลในเครื่อง',
        aboutToggle: 'ⓘ เกี่ยวกับ',
        sasDialogTitle: '🛡️ ยืนยันรหัสความปลอดภัย',
        sasDialogBodyLine1: 'อ่านตัวเลขด้านล่างให้กันและกันฟังผ่านช่องทางที่เชื่อถือได้ (โทรศัพท์ / พบกันตัวต่อตัว)',
        sasDialogBodyLine2: 'หากตรงกันเท่านั้นจึงไม่มีคนกลางดักฟัง — นี่คือขั้นตอนที่สำคัญที่สุด',
        peerPrefix: 'เพื่อน: ',
        sasAgree: '✓ ตรงกัน เริ่มแชตได้เลย',
        sasDisagree: '✗ ไม่ตรงกัน ตัดการเชื่อมต่อ',
        sasBarLabel: '🛡️ รหัสความปลอดภัย',
        sasVerifiedMark: '✓ ยืนยันว่าตรงกันแล้ว',
        createRoomTitle: 'สร้างห้องแบบหนึ่งต่อหนึ่งที่เข้มงวด: เมื่อมีคนเข้าร่วม 2 คนแล้ว ใครก็ตามที่มีลิงก์เพิ่มเติมจะถูกเซิร์ฟเวอร์ปฏิเสธ (ห้องเต็ม)',
        createRoomBtn: '🔗 สร้างห้อง',
        oneToOneNote: '· หนึ่งต่อหนึ่ง (ล็อกเมื่อมี 2 คนเข้าร่วม)',
        joinRoomBtn: '🔌 เข้าร่วมห้อง',
        roomCreatedHeading: '🔗 สร้างห้องแล้ว — ส่งลิงก์ให้เพื่อนของคุณ ระบบจะเข้าร่วมอัตโนมัติเมื่อเขาเปิดในเบราว์เซอร์',
        establishingEncrypted: '🔄 กำลังสร้างการเชื่อมต่อที่เข้ารหัส…',
        waitingPeerJoin: '● กำลังรอเพื่อนเข้าร่วม…',
        roomLinkWarning: '⚠️ ลิงก์มีโทเค็นห้องแบบใช้ครั้งเดียว ส่งผ่านช่องทางที่เชื่อถือได้ หลังเชื่อมต่อแล้ว ให้ยืนยัน "รหัสความปลอดภัย" ด้านล่างกับเพื่อนของคุณทางโทรศัพท์ / พบกันตัวต่อตัว ก่อนแชต — นี่คือขั้นตอนสำคัญในการตัดความเป็นไปได้ของคนกลางดักฟัง (รวมถึงเซิร์ฟเวอร์ส่งสัญญาณที่เป็นอันตราย)',
        copyLink: '📋 คัดลอกลิงก์',
        collapse: 'ยุบ',
        aboutPrivacyTitle: 'ข้อความถูกเข้ารหัสแบบ end-to-end และส่งตรงระหว่างเพื่อนถึงเพื่อน เซิร์ฟเวอร์เพียงส่งต่อการจับคู่เท่านั้น และไม่เคยจัดการหรือจัดเก็บข้อความใด ๆ',
        aboutPrivacyBody: '🔒 เซิร์ฟเวอร์ไม่จัดเก็บประวัติแชต ข้อความถูกเข้ารหัสแบบ end-to-end และส่งตรงระหว่างเพื่อนถึงเพื่อน ประวัติแชตอยู่เฉพาะในเบราว์เซอร์ของอุปกรณ์นี้เท่านั้น (ลบเมื่อปิดหน้าเว็บ ไม่เคยถูกอัปโหลด)',
        clearDataTitle: 'ลบตัวตนและข้อมูลในเครื่องทั้งหมดที่บันทึกไว้ในเบราว์เซอร์นี้ กลับสู่สถานะเริ่มต้น',
        clearDataBtn: 'ล้างข้อมูลในเครื่อง',
        emptyConnected: 'สร้างช่องทางเข้ารหัสแล้ว — ส่งข้อความเพื่อเริ่มแชต',
        emptyDisconnected: 'คลิก "🔗 สร้างห้อง" เพื่อสร้างลิงก์ให้เพื่อนของคุณ\nหรือเปิดลิงก์ที่เขาส่งมา เพื่อเริ่มแชตที่เข้ารหัสแบบ end-to-end',
        placeholderWaitingSecure: 'กำลังรอช่องทางที่ปลอดภัย…',
        placeholderConfirmSas: 'ยืนยันรหัสความปลอดภัยก่อน แล้วคลิก "ตรงกัน"…',
        joinRoomDialogTitle: '🔌 เข้าร่วมห้อง',
        pasteRoomLink: 'วางลิงก์ห้องที่เพื่อนของคุณส่งมา:',
        cancel: 'ยกเลิก',
        join: 'เข้าร่วม',
        loadIdentityFailed: 'อ่านตัวตนในเครื่องล้มเหลว กรุณารีเฟรชหน้าเว็บแล้วลองอีกครั้ง',
        identityIncomplete: 'ตัวตนในเครื่องไม่สมบูรณ์ ไม่สามารถสร้างช่องทางเข้ารหัสได้ กรุณารีเซ็ตตัวตนแล้วลองอีกครั้ง',
        secureChannelFailed: 'สร้างช่องทางเข้ารหัสล้มเหลว กรุณาลองอีกครั้ง',
        e2eEstablished: '🔐 สร้างช่องทางเข้ารหัสแบบ end-to-end แล้ว ยืนยันรหัสความปลอดภัยด้านล่างกับเพื่อนของคุณก่อนแชต',
        e2eEstablishing: '🔐 กำลังสร้างช่องทางเข้ารหัสแบบ end-to-end…',
        peerVerifyFailed: '⛔ การยืนยันตัวตนของเพื่อนล้มเหลว — อาจมีคนกลางดักฟัง ตัดการเชื่อมต่อแล้ว',
        relayNotice: '🔒 คุณจะเชื่อมต่อกับเพื่อนแบบเข้ารหัสผ่านเซิร์ฟเวอร์รีเลย์ IP จริงของคุณจะไม่ถูกเปิดเผยต่อเขา',
        connectedEstablishing: '✅ เชื่อมต่อกับเพื่อนแล้ว กำลังสร้างการเข้ารหัสแบบ end-to-end…',
        connectFailed: 'เชื่อมต่อล้มเหลว กรุณาลองอีกครั้ง',
        peerDisconnected: 'การเชื่อมต่อกับเพื่อนของคุณถูกปิดแล้ว',
        peerJoinedConnecting: 'เพื่อนเข้าร่วมแล้ว กำลังเชื่อมต่อ…',
        negotiationFailed: 'การเจรจาเชื่อมต่อล้มเหลว กรุณาลองอีกครั้ง',
        negotiationError: 'การเจรจาเชื่อมต่อเกิดข้อผิดพลาด กรุณาลองอีกครั้ง',
        peerLeft: 'เพื่อนของคุณออกไปแล้ว เซสชันนี้สิ้นสุดลง',
        signalingError: 'บริการเชื่อมต่อเกิดข้อผิดพลาด กรุณาลองใหม่ภายหลัง',
        roomReadyWaiting: 'ห้องพร้อมแล้ว กำลังรอเพื่อนเข้าร่วม…',
        joinedConnecting: 'เข้าร่วมห้องแล้ว กำลังเชื่อมต่อกับเพื่อน…',
        serverConnectFailed: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ ตรวจสอบเครือข่ายของคุณแล้วลองอีกครั้ง',
        notSecureYet: 'ช่องทางที่ปลอดภัยยังไม่พร้อม ไม่สามารถส่งข้อความได้',
        verifySasFirst: 'ยืนยันรหัสความปลอดภัยกับเพื่อนของคุณทางโทรศัพท์ / พบกันตัวต่อตัว และยืนยันว่าตรงกันก่อน แล้วจึงส่งข้อความ',
        invalidRoomLink: 'ลิงก์ห้องไม่ถูกต้อง ควรมีลักษณะเช่น https://…/#room=xxx&t=yyy',
        roomCodeBtn: '🔢 รหัสห้อง',
        roomCodeTitle: 'เชื่อมต่อด้วยรหัสห้องที่ตกลงกันไว้ (ไม่ต้องส่งลิงก์ยาว)',
        roomCodeDialogTitle: 'เชื่อมต่อด้วยรหัสห้อง',
        roomCodeDialogBody: 'ตกลงใช้รหัสห้องเดียวกัน: คนหนึ่งแตะสร้าง อีกคนแตะเข้าร่วม ไม่ต้องส่งลิงก์ห้องยาว ๆ',
        roomCodePlaceholder: 'ป้อนรหัสห้องที่ตกลงกันไว้ (อย่างน้อย 8 chars)',
        roomCodeSecurityHint: 'รหัสห้องเป็นเพียงป้ายนัดพบและสามารถเดาได้ การป้องกัน MITM ยังคงมาจากการยืนยันรหัสความปลอดภัย / รหัสจับคู่หลังเชื่อมต่อ — อย่าลืมยืนยัน',
        roomCodeCreateBtn: 'สร้างห้อง',
        roomCodeJoinBtn: 'เข้าร่วมห้อง',
        roomCodeTooShort: 'รหัสห้องสั้นเกินไป (อย่างน้อย 8 chars)',
        roomCodeShareLabel: 'บอกรหัสห้องนี้กับเพื่อนของคุณ:',
        roomCodeShareHint: 'ให้เขาเปิด "รหัสห้อง" แตะเข้าร่วม และป้อนรหัสเดียวกัน อย่าลืมยืนยันรหัสความปลอดภัย / รหัสจับคู่',
        disconnectedManual: 'ตัดการเชื่อมต่อแล้ว',
        copiedToClipboard: 'คัดลอกไปยังคลิปบอร์ดแล้ว',
        relayNotReady: 'เซิร์ฟเวอร์รีเลย์ยังไม่พร้อมและการเชื่อมต่ออาจล้มเหลว หากยังเข้าถึงไม่ได้ กรุณาติดต่อผู้ดูแลเว็บไซต์',
        sasMismatch: 'รหัสความปลอดภัยไม่ตรงกัน — อาจมีคนกลางดักฟัง ตัดการเชื่อมต่อแล้ว',
        nicknameUpdated: 'อัปเดตชื่อเล่นแล้ว',
        nicknameUpdateFailed: 'อัปเดตชื่อเล่นล้มเหลว',
        sasConfirmedToast: 'ยืนยันว่ารหัสความปลอดภัยตรงกันแล้ว — คุณสามารถเริ่มแชตได้',
        setNicknamePrompt: 'ตั้งชื่อเล่นของคุณ (เพื่อนของคุณมองเห็น):',
        clearDataConfirm: 'ล้างข้อมูลในเครื่องทั้งหมดบนอุปกรณ์นี้?\n\nการทำเช่นนี้จะลบตัวตนที่เข้ารหัสและข้อมูลในเครื่องทั้งหมดที่บันทึกไว้ในเบราว์เซอร์นี้ และไม่สามารถย้อนกลับได้ (เซิร์ฟเวอร์ไม่ได้จัดเก็บอะไรอยู่แล้ว) หลังจากนั้นคุณจะกลับไปที่ "ตั้งวลีรหัสผ่าน" และเริ่มต้นใหม่',
        pairUseToggle: 'ใช้รหัสจับคู่ (ยืนยันอัตโนมัติ ไม่ต้องตรวจรหัสความปลอดภัยด้วยตนเอง)',
        pairCodeLabel: 'รหัสจับคู่',
        pairShareHint: '⚠️ แชร์รหัสจับคู่กับเพื่อนของคุณผ่านช่องทางที่เชื่อถือได้ที่แตกต่างกัน (พบกันตัวต่อตัว / โทรศัพท์ / แอปเข้ารหัสอื่น) — อย่าส่งผ่านช่องทางเดียวกับลิงก์ด้านบน มิฉะนั้นจะไม่มีการป้องกันใด ๆ',
        pairEnterTitle: '🔑 ป้อนรหัสจับคู่',
        pairEnterBody: 'เพื่อนของคุณเปิดใช้การยืนยันด้วยรหัสจับคู่ ป้อนรหัสที่เขาให้คุณผ่านช่องทางที่เชื่อถือได้ เพื่อยืนยันโดยอัตโนมัติว่าไม่มีคนกลางดักฟัง',
        pairEnterPlaceholder: 'เช่น ABCD-1234-EFGH-…',
        pairConfirmBtn: 'ยืนยัน',
        pairVerifyingBadge: '🔒 เข้ารหัส · กำลังยืนยันรหัสจับคู่',
        pairVerifiedBadge: '🔐 ยืนยันรหัสจับคู่แล้ว',
        pairVerifiedMark: '✓ ยืนยันรหัสจับคู่แล้ว (ป้องกัน MITM อัตโนมัติ)',
        pairBarLabel: 'รหัสจับคู่:',
        pairFailed: 'รหัสจับคู่ไม่ตรงกันหรือมีคนกลางดักฟัง — ตัดการเชื่อมต่อแล้ว',
        pairMissingCode: 'ป้อนรหัสจับคู่ฉบับเต็มก่อน (รหัสที่ระบบสร้างให้)',
        pairTimedOut: 'การยืนยันการจับคู่หมดเวลา — ตัดการเชื่อมต่อแล้ว (ตรวจสอบว่าทั้งสองฝ่ายใช้รหัสเดียวกัน)',
        pairJoinOptional: 'รหัสจับคู่ (ไม่บังคับ กรอกหากเพื่อนของคุณเปิดใช้ — ยืนยันอัตโนมัติ ไม่ต้องตรวจรหัสความปลอดภัยด้วยตนเอง)',
        blobShareBtn: '📤 แชร์ไฟล์ (ลิงก์)',
        blobShareTitle: 'เข้ารหัสและอัปโหลดไฟล์ รับลิงก์แชร์ (ผู้รับไม่จำเป็นต้องออนไลน์ — ดาวน์โหลดผ่านลิงก์)',
        blobUploading: 'กำลังเข้ารหัสและอัปโหลด…',
        blobPasswordPrompt: 'ไม่บังคับ: ตั้งรหัสผ่านสำหรับดาวน์โหลด (เว้นว่าง = ลิงก์อย่างเดียวก็พอ) หากตั้งไว้ ผู้รับต้องใช้ลิงก์ + รหัสผ่าน',
        blobReady: '✅ สร้างลิงก์แชร์แล้ว (ไฟล์ถูกเข้ารหัสและอัปโหลดแล้ว)',
        blobFailed: 'อัปโหลดไฟล์ล้มเหลว',
        blobTooLarge: 'ไฟล์ใหญ่เกินไป: การอัปโหลดครั้งเดียวแบบโฮสต์จำกัดที่ ~95MB (ขีดจำกัด request-body ของ Cloudflare 100MB) ไฟล์ที่ใหญ่กว่านี้ต้องใช้การอัปโหลดแบบ multipart (ยังไม่รองรับ)',
        blobLinkHeading: '📦 ลิงก์แชร์ไฟล์ (มีกุญแจถอดรหัสอยู่ด้วย — ส่งผ่านช่องทางที่เชื่อถือได้)',
        blobLinkHint: '⚠️ ลิงก์มีกุญแจถอดรหัสอยู่ ผู้รับสามารถดาวน์โหลดและถอดรหัสได้โดยไม่ต้องออนไลน์ หมดอายุใน 24h ตามค่าเริ่มต้น',
        file: {
          attachTitle: 'ส่งไฟล์หรือรูปภาพ',
          busy: 'กำลังส่งไฟล์อยู่แล้ว — รอให้เสร็จก่อนส่งไฟล์ถัดไป',
          tooLarge: 'ไฟล์เกินขีดจำกัด 100 MB',
          readFailed: 'อ่านไฟล์ล้มเหลว',
          offerFailed: 'ส่งไฟล์ล้มเหลว',
          sending: 'กำลังส่ง',
          receiving: 'กำลังรับ',
          completed: 'เสร็จสิ้น',
          failed: 'การถ่ายโอนล้มเหลว',
          cancelled: 'ยกเลิกแล้ว',
          verifyFailed: 'การตรวจสอบไฟล์ล้มเหลว (ขนาดหรือแฮชไม่ตรงกัน) ทิ้งแล้ว',
          incoming: 'กำลังรับไฟล์…',
          sent: 'ส่งแล้ว',
          received: 'รับแล้ว',
          download: 'ดาวน์โหลด',
          cancel: 'ยกเลิก',
          imageAlt: 'รูปภาพที่ได้รับ'
        }
      }
    }
  },
  'vi': {
    appTitle: 'VeilConnect',
    appSubtitle: 'Trò chuyện mã hóa P2P',
    appDescription: 'Ứng dụng trò chuyện mã hóa đầu cuối P2P giúp bảo đảm quyền riêng tư và an toàn cho liên lạc của bạn mà không phụ thuộc vào máy chủ trung tâm.',

    welcome: {
      title: 'VeilConnect',
      subtitle: 'Trò chuyện mã hóa P2P',
      description: 'Chào mừng đến với VeilConnect! Đây là ứng dụng trò chuyện mã hóa đầu cuối P2P giúp bảo đảm quyền riêng tư và an toàn cho liên lạc của bạn mà không phụ thuộc vào máy chủ trung tâm.',
      features: {
        title: '🔐 Tính năng cốt lõi',
        encryption: '• Mã hóa đầu cuối (XSalsa20-Poly1305)',
        p2p: '• Liên lạc trực tiếp P2P (WebRTC)',
        customId: '• ID người dùng tùy chỉnh',
        fileTransfer: '• Hỗ trợ truyền tệp',
        decentralized: '• Phi tập trung hoàn toàn'
      },
      startButton: 'Bắt đầu'
    },

    identity: {
      generateButton: 'Tạo danh tính mới',
      clearButton: 'Xóa danh tính',
      status: {
        active: '✅ Danh tính đang hoạt động',
        inactive: 'ℹ️ Vui lòng tạo danh tính trước',
        pleaseGenerate: 'Vui lòng tạo danh tính trước'
      },
      userId: 'ID người dùng:',
      nickname: 'Biệt danh:',
      publicKey: 'Khóa công khai:',
      privateKey: 'Khóa riêng tư:'
    },

    encryption: {
      title: '🔐 Kiểm tra mã hóa',
      inputPlaceholder: 'Nhập văn bản cần mã hóa',
      testButton: 'Kiểm tra mã hóa',
      original: 'Bản gốc:',
      encrypted: 'Đã mã hóa:',
      decrypted: 'Đã giải mã:',
      success: '✅ Kiểm tra mã hóa thành công',
      error: 'Kiểm tra mã hóa thất bại',
      pleaseGenerateIdentity: 'Vui lòng tạo danh tính trước',
      pleaseEnterText: 'Vui lòng nhập văn bản cần mã hóa'
    },

    system: {
      title: '📊 Trạng thái hệ thống',
      identityStatus: 'Trạng thái danh tính:',
      messageCount: 'Số tin nhắn:',
      contactCount: 'Số liên hệ:',
      uptime: 'Thời gian hoạt động:',
      seconds: 'giây'
    },

    features: {
      title: '🚀 Giới thiệu tính năng cốt lõi',
      encryptionDemo: {
        title: '🔐 Mã hóa đầu cuối',
        description: 'Bảo mật tin nhắn bằng thuật toán XSalsa20-Poly1305',
        button: 'Thử mã hóa'
      },
      identityDemo: {
        title: '🆔 Danh tính người dùng',
        description: 'Danh tính duy nhất dựa trên khóa công khai Ed25519',
        button: 'Thử danh tính'
      },
      storageDemo: {
        title: '💾 Lưu trữ cục bộ',
        description: 'Lưu trữ mã hóa cục bộ cho tin nhắn và liên hệ',
        button: 'Thử lưu trữ'
      },
      p2pDemo: {
        title: '🌐 Kết nối P2P',
        description: 'Liên lạc trực tiếp WebRTC (cần hai máy khách)',
        button: 'Thử P2P'
      }
    },

    log: {
      title: '📝 Nhật ký hệ thống',
      clearButton: 'Xóa nhật ký',
      cleared: 'Đã xóa nhật ký'
    },

    settings: {
      title: '⚙️ Cài đặt',
      language: 'Ngôn ngữ',
      theme: 'Giao diện',
      notifications: 'Thông báo'
    },

    common: {
      save: 'Lưu',
      cancel: 'Hủy',
      confirm: 'Xác nhận',
      delete: 'Xóa',
      edit: 'Sửa',
      close: 'Đóng',
      back: 'Quay lại',
      next: 'Tiếp theo',
      loading: 'Đang tải...',
      error: 'Lỗi',
      success: 'Thành công',
      warning: 'Cảnh báo',
      info: 'Thông tin'
    },

    completion: {
      title: 'Tạo danh tính thành công!',
      description: '🎉 Chúc mừng! Bạn đã tạo thành công danh tính VeilConnect của mình. Giờ đây bạn có thể thiết lập các kết nối P2P an toàn với những người dùng khác.',
      idType: 'Loại ID:',
      restartButton: 'Đặt lại',
      chatButton: 'Bắt đầu trò chuyện',
      chatComingSoon: 'Tính năng trò chuyện đang được phát triển...'
    },

    chat: {
      needIdentity: 'Cần có danh tính',
      generateFirst: 'Vui lòng tạo danh tính trước để bắt đầu trò chuyện',
      notConnected: 'Chưa kết nối',
      connecting: 'Đang kết nối',
      connected: 'Đã thiết lập kết nối P2P',
      disconnected: 'Mất kết nối P2P',
      encrypted: 'Liên lạc đã mã hóa',
      offline: 'Ngoại tuyến',
      createConnection: 'Tạo',
      joinConnection: 'Tham gia',
      disconnect: 'Ngắt kết nối',
      connect: 'Kết nối',
      typePlaceholder: 'Nhập tin nhắn...',
      connectToSend: 'Kết nối với một người để gửi tin nhắn',
      shareConnection: 'Chia sẻ kết nối',
      shareInstructions: 'Chia sẻ ID kết nối này với bạn của bạn:',
      joinInstructions: 'Nhập ID kết nối từ bạn của bạn:',
      connectionIdPlaceholder: 'Dán ID kết nối vào đây',
      waitingConnection: 'Đang chờ người kia kết nối',
      connectionFailed: 'Tạo kết nối thất bại',
      joinFailed: 'Tham gia kết nối thất bại',
      sendFailed: 'Gửi tin nhắn thất bại',
      idCopied: 'Đã sao chép ID kết nối vào bộ nhớ tạm',
      send: 'Gửi',
      p2p: {
        headerTitle: '💬 Trò chuyện an toàn P2P',
        editNicknameTitle: 'Nhấp để thay đổi biệt danh của bạn (người kia có thể thấy)',
        mePrefix: 'Tôi: ',
        unnamed: 'Chưa đặt tên',
        badgeVerifiedTitle: 'Tin nhắn được mã hóa đầu cuối và bạn đã xác minh mã an toàn ngoài luồng — không có người đứng giữa',
        badgeVerified: '🔒 Đã mã hóa · Đã xác minh',
        badgeEncryptedTitle: 'Tin nhắn được mã hóa đầu cuối, nhưng mã an toàn chưa được xác minh ngoài luồng, nên chưa thể loại trừ người đứng giữa',
        badgePendingSas: '🔒 Đã mã hóa · Xác minh mã an toàn',
        badgeHandshaking: '🔄 Đang thiết lập kết nối an toàn…',
        badgeFailed: '⛔ Xác minh thất bại',
        aboutTitle: 'Giới thiệu / Quyền riêng tư & dữ liệu cục bộ',
        aboutToggle: 'ⓘ Giới thiệu',
        sasDialogTitle: '🛡️ Xác minh mã an toàn',
        sasDialogBodyLine1: 'Hãy đọc các chữ số bên dưới cho nhau qua một kênh tin cậy (điện thoại / gặp trực tiếp).',
        sasDialogBodyLine2: 'Chỉ khi chúng khớp nhau thì mới không có người đứng giữa — đây là bước quan trọng nhất.',
        peerPrefix: 'Người kia: ',
        sasAgree: '✓ Chúng khớp nhau, bắt đầu trò chuyện',
        sasDisagree: '✗ Chúng khác nhau, ngắt kết nối',
        sasBarLabel: '🛡️ Mã an toàn',
        sasVerifiedMark: '✓ Đã xác minh khớp',
        createRoomTitle: 'Tạo một phòng riêng tư một-một nghiêm ngặt: khi 2 người đã tham gia, bất kỳ ai khác có liên kết đều bị máy chủ từ chối (Phòng đã đầy).',
        createRoomBtn: '🔗 Tạo phòng',
        oneToOneNote: '· Một-một (khóa lại sau khi 2 người tham gia)',
        joinRoomBtn: '🔌 Tham gia phòng',
        roomCreatedHeading: '🔗 Đã tạo phòng — gửi liên kết cho người kia; phòng sẽ tự động tham gia khi họ mở liên kết trong trình duyệt',
        establishingEncrypted: '🔄 Đang thiết lập kết nối đã mã hóa…',
        waitingPeerJoin: '● Đang chờ người kia tham gia…',
        roomLinkWarning: '⚠️ Liên kết chứa một mã phòng dùng một lần; hãy gửi qua một kênh tin cậy. Sau khi kết nối, hãy xác minh “mã an toàn” bên dưới với người kia qua điện thoại / gặp trực tiếp trước khi trò chuyện — đây là bước then chốt để loại trừ người đứng giữa (kể cả máy chủ báo hiệu độc hại).',
        copyLink: '📋 Sao chép liên kết',
        collapse: 'Thu gọn',
        aboutPrivacyTitle: 'Tin nhắn được mã hóa đầu cuối và gửi trực tiếp giữa hai bên; máy chủ chỉ chuyển tiếp việc ghép cặp và không bao giờ xử lý hay lưu trữ bất kỳ tin nhắn nào',
        aboutPrivacyBody: '🔒 Máy chủ không lưu trữ lịch sử trò chuyện; tin nhắn được mã hóa đầu cuối và gửi trực tiếp giữa hai bên. Lịch sử trò chuyện chỉ tồn tại trong trình duyệt của thiết bị này (bị xóa khi đóng trang, không bao giờ được tải lên).',
        clearDataTitle: 'Xóa danh tính và toàn bộ dữ liệu cục bộ đã lưu trong trình duyệt này, trở về trạng thái ban đầu',
        clearDataBtn: 'Xóa dữ liệu cục bộ',
        emptyConnected: 'Đã thiết lập kênh mã hóa — gửi một tin nhắn để bắt đầu trò chuyện.',
        emptyDisconnected: 'Nhấp “🔗 Tạo phòng” để tạo liên kết cho người kia,\nhoặc mở liên kết họ đã gửi cho bạn, để bắt đầu trò chuyện mã hóa đầu cuối.',
        placeholderWaitingSecure: 'Đang chờ kênh an toàn…',
        placeholderConfirmSas: 'Hãy xác minh mã an toàn trước rồi nhấp “Chúng khớp nhau”…',
        joinRoomDialogTitle: '🔌 Tham gia phòng',
        pasteRoomLink: 'Dán liên kết phòng mà người kia đã gửi cho bạn:',
        cancel: 'Hủy',
        join: 'Tham gia',
        loadIdentityFailed: 'Không đọc được danh tính cục bộ. Vui lòng làm mới trang và thử lại.',
        identityIncomplete: 'Danh tính cục bộ chưa hoàn chỉnh; không thể thiết lập kênh mã hóa. Vui lòng đặt lại danh tính và thử lại.',
        secureChannelFailed: 'Thiết lập kênh mã hóa thất bại. Vui lòng thử lại.',
        e2eEstablished: '🔐 Đã thiết lập kênh mã hóa đầu cuối. Hãy xác minh mã an toàn bên dưới với người kia trước khi trò chuyện.',
        e2eEstablishing: '🔐 Đang thiết lập kênh mã hóa đầu cuối…',
        peerVerifyFailed: '⛔ Xác minh danh tính người kia thất bại — có thể có người đứng giữa. Đã ngắt kết nối.',
        relayNotice: '🔒 Bạn sẽ kết nối với người kia ở dạng mã hóa qua một máy chủ chuyển tiếp; IP thật của bạn không bị lộ cho họ.',
        connectedEstablishing: '✅ Đã kết nối với người kia, đang thiết lập mã hóa đầu cuối…',
        connectFailed: 'Kết nối thất bại. Vui lòng thử lại.',
        peerDisconnected: 'Kết nối với người kia đã bị đóng.',
        peerJoinedConnecting: 'Người kia đã tham gia, đang kết nối…',
        negotiationFailed: 'Thương lượng kết nối thất bại. Vui lòng thử lại.',
        negotiationError: 'Lỗi thương lượng kết nối. Vui lòng thử lại.',
        peerLeft: 'Người kia đã rời đi; phiên này đã kết thúc.',
        signalingError: 'Dịch vụ kết nối gặp lỗi. Vui lòng thử lại sau.',
        roomReadyWaiting: 'Phòng đã sẵn sàng, đang chờ người kia tham gia…',
        joinedConnecting: 'Đã tham gia phòng, đang kết nối với người kia…',
        serverConnectFailed: 'Không thể kết nối với máy chủ. Kiểm tra mạng của bạn và thử lại.',
        notSecureYet: 'Kênh an toàn chưa sẵn sàng; không thể gửi tin nhắn',
        verifySasFirst: 'Hãy xác minh mã an toàn với người kia qua điện thoại / gặp trực tiếp và xác nhận nó khớp nhau, rồi gửi tin nhắn',
        invalidRoomLink: 'Liên kết phòng không hợp lệ. Nó phải có dạng như https://…/#room=xxx&t=yyy',
        roomCodeBtn: '🔢 Mã phòng',
        roomCodeTitle: 'Kết nối bằng một mã phòng đã thỏa thuận (không cần gửi liên kết dài)',
        roomCodeDialogTitle: 'Kết nối bằng mã phòng',
        roomCodeDialogBody: 'Thỏa thuận cùng một mã phòng: một người nhấn Tạo, người kia nhấn Tham gia. Không cần gửi liên kết phòng dài.',
        roomCodePlaceholder: 'Nhập mã phòng đã thỏa thuận (tối thiểu 8 chars)',
        roomCodeSecurityHint: 'Mã phòng chỉ là một nhãn điểm hẹn và có thể bị đoán; việc chống MITM vẫn đến từ xác minh mã an toàn / mã ghép cặp sau khi kết nối — hãy chắc chắn xác minh.',
        roomCodeCreateBtn: 'Tạo phòng',
        roomCodeJoinBtn: 'Tham gia phòng',
        roomCodeTooShort: 'Mã phòng quá ngắn (tối thiểu 8 chars)',
        roomCodeShareLabel: 'Nói cho người kia mã phòng này:',
        roomCodeShareHint: 'Bảo họ mở “Mã phòng”, nhấn Tham gia và nhập cùng một mã. Nhớ xác minh mã an toàn / mã ghép cặp.',
        disconnectedManual: 'Đã ngắt kết nối',
        copiedToClipboard: 'Đã sao chép vào bộ nhớ tạm',
        relayNotReady: 'Máy chủ chuyển tiếp chưa sẵn sàng và kết nối có thể thất bại. Nếu vẫn không thể truy cập, hãy liên hệ quản trị viên trang web.',
        sasMismatch: 'Mã an toàn không khớp — có thể có người đứng giữa. Đã ngắt kết nối.',
        nicknameUpdated: 'Đã cập nhật biệt danh',
        nicknameUpdateFailed: 'Cập nhật biệt danh thất bại',
        sasConfirmedToast: 'Đã xác nhận mã an toàn khớp nhau — bạn có thể bắt đầu trò chuyện',
        setNicknamePrompt: 'Đặt biệt danh của bạn (người kia có thể thấy):',
        clearDataConfirm: 'Xóa toàn bộ dữ liệu cục bộ trên thiết bị này?\n\nThao tác này xóa danh tính đã mã hóa và toàn bộ dữ liệu cục bộ đã lưu trong trình duyệt này, và không thể hoàn tác (dù sao máy chủ cũng không lưu gì). Sau đó bạn sẽ trở về “Đặt cụm mật khẩu” và bắt đầu lại.',
        pairUseToggle: 'Dùng mã ghép cặp (tự động xác minh, không cần kiểm tra mã an toàn thủ công)',
        pairCodeLabel: 'Mã ghép cặp',
        pairShareHint: '⚠️ Chia sẻ mã ghép cặp với người kia qua một kênh tin cậy KHÁC (gặp trực tiếp / điện thoại / một ứng dụng mã hóa khác) — không bao giờ qua cùng kênh với liên kết ở trên, nếu không nó chẳng bảo vệ được gì.',
        pairEnterTitle: '🔑 Nhập mã ghép cặp',
        pairEnterBody: 'Người kia đã bật xác minh bằng mã ghép cặp. Nhập mã họ đưa cho bạn qua một kênh tin cậy để tự động xác nhận không có người đứng giữa.',
        pairEnterPlaceholder: 'vd. ABCD-1234-EFGH-…',
        pairConfirmBtn: 'Xác nhận',
        pairVerifyingBadge: '🔒 Đã mã hóa · đang xác minh mã ghép cặp',
        pairVerifiedBadge: '🔐 Đã xác minh mã ghép cặp',
        pairVerifiedMark: '✓ Đã xác minh mã ghép cặp (tự động chống MITM)',
        pairBarLabel: 'Mã ghép cặp:',
        pairFailed: 'Mã ghép cặp không khớp hoặc có người đứng giữa — đã ngắt kết nối',
        pairMissingCode: 'Hãy nhập đầy đủ mã ghép cặp (mã do hệ thống tạo) trước',
        pairTimedOut: 'Xác minh ghép cặp đã hết thời gian — đã ngắt kết nối (kiểm tra cả hai bên dùng cùng một mã)',
        pairJoinOptional: 'Mã ghép cặp (tùy chọn; điền vào nếu người kia đã bật — tự động xác minh, không cần kiểm tra mã an toàn thủ công)',
        blobShareBtn: '📤 Chia sẻ một tệp (liên kết)',
        blobShareTitle: 'Mã hóa & tải lên một tệp, nhận liên kết chia sẻ (người nhận không cần trực tuyến — họ tải về qua liên kết)',
        blobUploading: 'Đang mã hóa & tải lên…',
        blobPasswordPrompt: 'Tùy chọn: đặt mật khẩu tải về (để trống = chỉ cần liên kết là đủ). Nếu đặt, người nhận cần liên kết + mật khẩu.',
        blobReady: '✅ Đã tạo liên kết chia sẻ (tệp đã được mã hóa & tải lên)',
        blobFailed: 'Tải tệp lên thất bại',
        blobTooLarge: 'Tệp quá lớn: bản tải lên một lần trên dịch vụ lưu trữ giới hạn ở mức ~95MB (giới hạn cứng thân yêu cầu 100MB của Cloudflare). Tệp lớn hơn cần tải lên nhiều phần (chưa được hỗ trợ).',
        blobLinkHeading: '📦 Liên kết chia sẻ tệp (chứa khóa giải mã — gửi qua một kênh tin cậy)',
        blobLinkHint: '⚠️ Liên kết chứa khóa giải mã; người nhận có thể tải về & giải mã mà không cần trực tuyến. Mặc định hết hạn sau 24h.',
        file: {
          attachTitle: 'Gửi một tệp hoặc ảnh',
          busy: 'Đang gửi một tệp rồi — hãy chờ nó hoàn tất trước khi gửi tệp khác',
          tooLarge: 'Tệp vượt quá giới hạn 100 MB',
          readFailed: 'Đọc tệp thất bại',
          offerFailed: 'Gửi tệp thất bại',
          sending: 'Đang gửi',
          receiving: 'Đang nhận',
          completed: 'Đã hoàn tất',
          failed: 'Truyền thất bại',
          cancelled: 'Đã hủy',
          verifyFailed: 'Xác minh tệp thất bại (kích thước hoặc mã băm không khớp); đã loại bỏ',
          incoming: 'Đang nhận một tệp…',
          sent: 'Đã gửi',
          received: 'Đã nhận',
          download: 'Tải về',
          cancel: 'Hủy',
          imageAlt: 'Ảnh đã nhận'
        }
      }
    }
  },
};
