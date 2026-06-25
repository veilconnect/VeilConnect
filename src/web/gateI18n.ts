/**
 * 口令门禁页（UnlockGate）的多语言文案 —— 该页在 React i18n 应用挂载之前运行，
 * 不在 I18nProvider 内，故独立于主 translations 维护一份精简文案表。
 * 语言选择逻辑与 useI18n 对齐（localStorage 'veilconnect-language' → 浏览器语言 → 基础码 → 默认）。
 * 覆盖与主界面一致的 15 种语言；键集由 tests/gateI18nParity 对齐测试兜底。
 */
import { DEFAULT_LANGUAGE } from '../renderer/i18n/languages';

export interface GateStrings {
  loading: string;
  promptUnlock: string;
  promptCreate: string;
  passphrasePlaceholder: string;
  confirmPlaceholder: string;
  showPassphrase: string;
  processing: string;
  unlockBtn: string;
  createBtn: string;
  forgotBtn: string;
  privacyNote: string;
  learnMore: string;
  errTooShort: string;
  errMismatch: string;
  errUnlock: string;
  errReset: string;
  resetConfirm: string;
}

/** 门禁文案表（与主 UI 同 15 种语言；{n} 为口令最小长度占位符，运行时替换）。 */
export const GATE_TRANSLATIONS: Record<string, GateStrings> = {
  'zh-CN': {
    loading: '加载中…',
    promptUnlock: '输入口令解锁本设备上的加密身份',
    promptCreate: '首次使用：设置一个口令来加密保护你的身份私钥',
    passphrasePlaceholder: '口令',
    confirmPlaceholder: '再次输入口令',
    showPassphrase: '显示口令',
    processing: '处理中…',
    unlockBtn: '解锁',
    createBtn: '创建并进入',
    forgotBtn: '忘记口令？重置并新建身份',
    privacyNote: '口令在本浏览器派生主密钥解密本地身份，绝不上传。忘记口令将无法恢复旧身份；可点上方「重置并新建身份」用新口令重来（或用此前加密导出的身份文件在新设备恢复）。',
    learnMore: '了解 VeilConnect · 下载桌面版 · 自部署 →',
    errTooShort: '口令至少 {n} 个字符',
    errMismatch: '两次输入的口令不一致',
    errUnlock: '解锁失败',
    errReset: '重置失败',
    resetConfirm: '确定重置吗？\n\n本设备上的旧身份将被永久清除、无法恢复（口令无法找回是端到端加密的设计）。\n清除后可用新口令创建一个全新身份继续使用。'
  },
  'en': {
    loading: 'Loading…',
    promptUnlock: 'Enter your passphrase to unlock the encrypted identity on this device',
    promptCreate: 'First time here: set a passphrase to encrypt and protect your identity private key',
    passphrasePlaceholder: 'Passphrase',
    confirmPlaceholder: 'Re-enter passphrase',
    showPassphrase: 'Show passphrase',
    processing: 'Processing…',
    unlockBtn: 'Unlock',
    createBtn: 'Create & enter',
    forgotBtn: 'Forgot passphrase? Reset and create a new identity',
    privacyNote: 'The passphrase derives a master key in this browser to decrypt your local identity and is never uploaded. If you forget it, the old identity cannot be recovered; click “Reset and create a new identity” above to start over with a new passphrase (or restore from a previously exported encrypted identity file on a new device).',
    learnMore: 'About VeilConnect · Download desktop · Self-host →',
    errTooShort: 'Passphrase must be at least {n} characters',
    errMismatch: 'The two passphrases do not match',
    errUnlock: 'Unlock failed',
    errReset: 'Reset failed',
    resetConfirm: 'Reset for sure?\n\nThe old identity on this device will be permanently erased and cannot be recovered (an unrecoverable passphrase is by design for end-to-end encryption).\nAfter clearing, you can create a brand-new identity with a new passphrase.'
  },
  'ja': {
    loading: '読み込み中…',
    promptUnlock: 'このデバイスの暗号化された身元を解除するため、パスフレーズを入力してください',
    promptCreate: '初めてのご利用です。身元の秘密鍵を暗号化して保護するパスフレーズを設定してください',
    passphrasePlaceholder: 'パスフレーズ',
    confirmPlaceholder: 'パスフレーズを再入力',
    showPassphrase: 'パスフレーズを表示',
    processing: '処理中…',
    unlockBtn: 'ロック解除',
    createBtn: '作成して入室',
    forgotBtn: 'パスフレーズをお忘れですか? リセットして新しい身元を作成',
    privacyNote: 'パスフレーズはこのブラウザー内でマスターキーを導出してローカルの身元を復号するために使われ、アップロードされることはありません。お忘れになると古い身元は復元できません。上の「リセットして新しい身元を作成」をクリックすると、新しいパスフレーズで最初からやり直せます(または新しいデバイスで、以前にエクスポートした暗号化済み身元ファイルから復元することもできます)。',
    learnMore: 'VeilConnect について · デスクトップ版をダウンロード · セルフホスト →',
    errTooShort: 'パスフレーズは {n} 文字以上にしてください',
    errMismatch: '2つのパスフレーズが一致しません',
    errUnlock: 'ロック解除に失敗しました',
    errReset: 'リセットに失敗しました',
    resetConfirm: '本当にリセットしますか?\n\nこのデバイス上の古い身元は完全に消去され、復元できなくなります(復元不可能なパスフレーズは、エンドツーエンド暗号化のための設計です)。\n消去後は、新しいパスフレーズでまったく新しい身元を作成できます。'
  },
  'es': {
    loading: 'Cargando…',
    promptUnlock: 'Introduce tu frase de contraseña para desbloquear la identidad cifrada en este dispositivo',
    promptCreate: 'Primera vez aquí: define una frase de contraseña para cifrar y proteger la clave privada de tu identidad',
    passphrasePlaceholder: 'Frase de contraseña',
    confirmPlaceholder: 'Vuelve a introducir la frase de contraseña',
    showPassphrase: 'Mostrar frase de contraseña',
    processing: 'Procesando…',
    unlockBtn: 'Desbloquear',
    createBtn: 'Crear y entrar',
    forgotBtn: '¿Olvidaste la frase de contraseña? Restablece y crea una identidad nueva',
    privacyNote: 'La frase de contraseña deriva una clave maestra en este navegador para descifrar tu identidad local y nunca se sube a ningún servidor. Si la olvidas, la identidad anterior no se podrá recuperar; haz clic en “Restablecer y crear una identidad nueva” arriba para empezar de cero con una nueva frase de contraseña (o restaura desde un archivo de identidad cifrada exportado previamente en un dispositivo nuevo).',
    learnMore: 'Acerca de VeilConnect · Descargar para escritorio · Alojamiento propio →',
    errTooShort: 'La frase de contraseña debe tener al menos {n} caracteres',
    errMismatch: 'Las dos frases de contraseña no coinciden',
    errUnlock: 'Error al desbloquear',
    errReset: 'Error al restablecer',
    resetConfirm: '¿Seguro que quieres restablecer?\n\nLa identidad anterior de este dispositivo se borrará de forma permanente y no se podrá recuperar (una frase de contraseña irrecuperable es intencional para el cifrado de extremo a extremo).\nDespués de borrarla, podrás crear una identidad totalmente nueva con una nueva frase de contraseña.'
  },
  'zh-TW': {
    loading: '載入中…',
    promptUnlock: '請輸入你的通行碼，以解鎖本裝置上加密的身分',
    promptCreate: '首次使用：請設定一組通行碼，用來加密並保護你的身分私鑰',
    passphrasePlaceholder: '通行碼',
    confirmPlaceholder: '再次輸入通行碼',
    showPassphrase: '顯示通行碼',
    processing: '處理中…',
    unlockBtn: '解鎖',
    createBtn: '建立並進入',
    forgotBtn: '忘記通行碼？重設並建立新身分',
    privacyNote: '通行碼會在這個瀏覽器內推導出主金鑰，用以解密你的本機身分，且絕不會上傳。若你忘記通行碼，舊身分將無法復原；請點選上方的「重設並建立新身分」，以新的通行碼重新開始（或在新裝置上，從先前匯出的加密身分檔案還原）。',
    learnMore: '關於 VeilConnect · 下載桌面版 · 自行架設 →',
    errTooShort: '通行碼長度至少需要 {n} 個字元',
    errMismatch: '兩次輸入的通行碼不一致',
    errUnlock: '解鎖失敗',
    errReset: '重設失敗',
    resetConfirm: '確定要重設嗎？\n\n本裝置上的舊身分將被永久清除且無法復原（通行碼無法復原是端對端加密的刻意設計）。\n清除後，你可以用新的通行碼建立全新的身分。'
  },
  'ko': {
    loading: '불러오는 중…',
    promptUnlock: '이 기기에 암호화되어 저장된 신원을 잠금 해제하려면 암호문구를 입력하세요',
    promptCreate: '처음 오셨군요: 암호문구를 설정하여 신원 개인 키를 암호화하고 보호하세요',
    passphrasePlaceholder: '암호문구',
    confirmPlaceholder: '암호문구 다시 입력',
    showPassphrase: '암호문구 표시',
    processing: '처리 중…',
    unlockBtn: '잠금 해제',
    createBtn: '생성 후 입장',
    forgotBtn: '암호문구를 잊으셨나요? 초기화하고 새 신원을 생성하세요',
    privacyNote: '암호문구는 이 브라우저에서 마스터 키를 도출하여 로컬 신원을 복호화하는 데 사용되며 절대 업로드되지 않습니다. 잊어버리면 이전 신원은 복구할 수 없으니, 위의 “초기화하고 새 신원을 생성” 버튼을 눌러 새 암호문구로 다시 시작하세요(또는 새 기기에서 이전에 내보낸 암호화된 신원 파일로 복원하세요).',
    learnMore: 'VeilConnect 소개 · 데스크톱 다운로드 · 자체 호스팅 →',
    errTooShort: '암호문구는 최소 {n}자 이상이어야 합니다',
    errMismatch: '두 암호문구가 일치하지 않습니다',
    errUnlock: '잠금 해제에 실패했습니다',
    errReset: '초기화에 실패했습니다',
    resetConfirm: '정말 초기화하시겠어요?\n\n이 기기의 이전 신원은 영구적으로 삭제되어 복구할 수 없습니다(복구 불가능한 암호문구는 종단 간 암호화를 위한 설계입니다).\n삭제 후에는 새 암호문구로 완전히 새로운 신원을 생성할 수 있습니다.'
  },
  'fr': {
    loading: 'Chargement…',
    promptUnlock: 'Saisissez votre phrase secrète pour déverrouiller l’identité chiffrée sur cet appareil',
    promptCreate: 'Première visite : définissez une phrase secrète pour chiffrer et protéger la clé privée de votre identité',
    passphrasePlaceholder: 'Phrase secrète',
    confirmPlaceholder: 'Ressaisissez la phrase secrète',
    showPassphrase: 'Afficher la phrase secrète',
    processing: 'Traitement…',
    unlockBtn: 'Déverrouiller',
    createBtn: 'Créer et entrer',
    forgotBtn: 'Phrase secrète oubliée ? Réinitialiser et créer une nouvelle identité',
    privacyNote: 'La phrase secrète dérive une clé maître dans ce navigateur pour déchiffrer votre identité locale et n’est jamais transmise. Si vous l’oubliez, l’ancienne identité ne pourra pas être récupérée ; cliquez sur « Réinitialiser et créer une nouvelle identité » ci-dessus pour recommencer avec une nouvelle phrase secrète (ou restaurez depuis un fichier d’identité chiffré exporté précédemment sur un nouvel appareil).',
    learnMore: 'À propos de VeilConnect · Télécharger l’application de bureau · Auto-hébergement →',
    errTooShort: 'La phrase secrète doit comporter au moins {n} caractères',
    errMismatch: 'Les deux phrases secrètes ne correspondent pas',
    errUnlock: 'Échec du déverrouillage',
    errReset: 'Échec de la réinitialisation',
    resetConfirm: 'Réinitialiser pour de bon ?\n\nL’ancienne identité sur cet appareil sera définitivement effacée et ne pourra pas être récupérée (une phrase secrète irrécupérable est une caractéristique voulue du chiffrement de bout en bout).\nAprès l’effacement, vous pourrez créer une toute nouvelle identité avec une nouvelle phrase secrète.'
  },
  'de': {
    loading: 'Wird geladen…',
    promptUnlock: 'Geben Sie Ihre Passphrase ein, um die verschlüsselte Identität auf diesem Gerät zu entsperren',
    promptCreate: 'Zum ersten Mal hier: Legen Sie eine Passphrase fest, um Ihren privaten Identitätsschlüssel zu verschlüsseln und zu schützen',
    passphrasePlaceholder: 'Passphrase',
    confirmPlaceholder: 'Passphrase erneut eingeben',
    showPassphrase: 'Passphrase anzeigen',
    processing: 'Wird verarbeitet…',
    unlockBtn: 'Entsperren',
    createBtn: 'Erstellen & eintreten',
    forgotBtn: 'Passphrase vergessen? Zurücksetzen und eine neue Identität erstellen',
    privacyNote: 'Die Passphrase leitet in diesem Browser einen Hauptschlüssel ab, um Ihre lokale Identität zu entschlüsseln, und wird niemals hochgeladen. Wenn Sie sie vergessen, kann die alte Identität nicht wiederhergestellt werden; klicken Sie oben auf „Zurücksetzen und eine neue Identität erstellen“, um mit einer neuen Passphrase neu zu beginnen (oder stellen Sie sie auf einem neuen Gerät aus einer zuvor exportierten verschlüsselten Identitätsdatei wieder her).',
    learnMore: 'Über VeilConnect · Desktop herunterladen · Selbst hosten →',
    errTooShort: 'Die Passphrase muss mindestens {n} Zeichen lang sein',
    errMismatch: 'Die beiden Passphrasen stimmen nicht überein',
    errUnlock: 'Entsperren fehlgeschlagen',
    errReset: 'Zurücksetzen fehlgeschlagen',
    resetConfirm: 'Wirklich zurücksetzen?\n\nDie alte Identität auf diesem Gerät wird dauerhaft gelöscht und kann nicht wiederhergestellt werden (eine nicht wiederherstellbare Passphrase ist für die Ende-zu-Ende-Verschlüsselung beabsichtigt).\nNach dem Löschen können Sie mit einer neuen Passphrase eine brandneue Identität erstellen.'
  },
  'ru': {
    loading: 'Загрузка…',
    promptUnlock: 'Введите пароль-фразу, чтобы разблокировать зашифрованную личность на этом устройстве',
    promptCreate: 'Вы здесь впервые: задайте пароль-фразу, чтобы зашифровать и защитить закрытый ключ вашей личности',
    passphrasePlaceholder: 'Пароль-фраза',
    confirmPlaceholder: 'Повторите пароль-фразу',
    showPassphrase: 'Показать пароль-фразу',
    processing: 'Обработка…',
    unlockBtn: 'Разблокировать',
    createBtn: 'Создать и войти',
    forgotBtn: 'Забыли пароль-фразу? Сбросить и создать новую личность',
    privacyNote: 'Пароль-фраза порождает мастер-ключ прямо в этом браузере для расшифровки вашей локальной личности и никогда не загружается на сервер. Если вы её забудете, прежнюю личность восстановить невозможно; нажмите «Сбросить и создать новую личность» выше, чтобы начать заново с новой пароль-фразой (или восстановите личность на новом устройстве из ранее экспортированного зашифрованного файла личности).',
    learnMore: 'О VeilConnect · Скачать для ПК · Свой сервер →',
    errTooShort: 'Пароль-фраза должна содержать не менее {n} символов',
    errMismatch: 'Две пароль-фразы не совпадают',
    errUnlock: 'Не удалось разблокировать',
    errReset: 'Не удалось сбросить',
    resetConfirm: 'Точно сбросить?\n\nПрежняя личность на этом устройстве будет безвозвратно удалена и не подлежит восстановлению (невосстановимость пароль-фразы предусмотрена для сквозного шифрования).\nПосле очистки вы сможете создать совершенно новую личность с новой пароль-фразой.'
  },
  'ar': {
    loading: 'جارٍ التحميل…',
    promptUnlock: 'أدخل عبارة المرور لفتح الهوية المشفّرة على هذا الجهاز',
    promptCreate: 'أول مرة هنا؟ عيّن عبارة مرور لتشفير مفتاح هويتك الخاص وحمايته',
    passphrasePlaceholder: 'عبارة المرور',
    confirmPlaceholder: 'أعد إدخال عبارة المرور',
    showPassphrase: 'إظهار عبارة المرور',
    processing: 'جارٍ المعالجة…',
    unlockBtn: 'فتح',
    createBtn: 'إنشاء ودخول',
    forgotBtn: 'نسيت عبارة المرور؟ أعد التعيين وأنشئ هوية جديدة',
    privacyNote: 'تشتقّ عبارة المرور مفتاحًا رئيسيًا داخل هذا المتصفّح لفكّ تشفير هويتك المحلية، ولا تُرفع إطلاقًا. إذا نسيتها فلا يمكن استعادة الهوية القديمة؛ انقر على ”أعد التعيين وأنشئ هوية جديدة“ أعلاه للبدء من جديد بعبارة مرور جديدة (أو استعد هويتك من ملف هوية مشفّر سبق تصديره على جهاز جديد).',
    learnMore: 'حول VeilConnect · تنزيل تطبيق سطح المكتب · الاستضافة الذاتية →',
    errTooShort: 'يجب ألّا تقلّ عبارة المرور عن {n} حرفًا',
    errMismatch: 'عبارتا المرور غير متطابقتين',
    errUnlock: 'فشل الفتح',
    errReset: 'فشل إعادة التعيين',
    resetConfirm: 'هل تريد إعادة التعيين بالتأكيد؟\n\nسوف تُمحى الهوية القديمة على هذا الجهاز نهائيًا ولا يمكن استعادتها (تعذّر استعادة عبارة المرور أمرٌ مقصود لضمان التشفير التام بين الطرفين).\nبعد المسح يمكنك إنشاء هوية جديدة تمامًا بعبارة مرور جديدة.'
  },
  'pt': {
    loading: 'A carregar…',
    promptUnlock: 'Introduza a sua frase-passe para desbloquear a identidade encriptada neste dispositivo',
    promptCreate: 'Primeira vez aqui: defina uma frase-passe para encriptar e proteger a chave privada da sua identidade',
    passphrasePlaceholder: 'Frase-passe',
    confirmPlaceholder: 'Reintroduza a frase-passe',
    showPassphrase: 'Mostrar frase-passe',
    processing: 'A processar…',
    unlockBtn: 'Desbloquear',
    createBtn: 'Criar e entrar',
    forgotBtn: 'Esqueceu a frase-passe? Reponha e crie uma nova identidade',
    privacyNote: 'A frase-passe deriva uma chave-mestra neste navegador para desencriptar a sua identidade local e nunca é enviada para servidores. Se a esquecer, a identidade antiga não pode ser recuperada; clique em “Repor e criar uma nova identidade” acima para começar de novo com uma nova frase-passe (ou restaure a partir de um ficheiro de identidade encriptado exportado anteriormente noutro dispositivo).',
    learnMore: 'Sobre o VeilConnect · Transferir versão para computador · Auto-alojamento →',
    errTooShort: 'A frase-passe deve ter pelo menos {n} caracteres',
    errMismatch: 'As duas frases-passe não coincidem',
    errUnlock: 'Falha ao desbloquear',
    errReset: 'Falha ao repor',
    resetConfirm: 'Repor de certeza?\n\nA identidade antiga neste dispositivo será apagada permanentemente e não poderá ser recuperada (uma frase-passe irrecuperável é intencional para a encriptação ponta a ponta).\nApós a limpeza, pode criar uma identidade totalmente nova com uma nova frase-passe.'
  },
  'it': {
    loading: 'Caricamento…',
    promptUnlock: 'Inserisci la tua passphrase per sbloccare l’identità cifrata su questo dispositivo',
    promptCreate: 'Prima volta qui: imposta una passphrase per cifrare e proteggere la chiave privata della tua identità',
    passphrasePlaceholder: 'Passphrase',
    confirmPlaceholder: 'Reinserisci la passphrase',
    showPassphrase: 'Mostra la passphrase',
    processing: 'Elaborazione…',
    unlockBtn: 'Sblocca',
    createBtn: 'Crea ed entra',
    forgotBtn: 'Hai dimenticato la passphrase? Reimposta e crea una nuova identità',
    privacyNote: 'La passphrase deriva una chiave principale in questo browser per decifrare la tua identità locale e non viene mai caricata. Se la dimentichi, la vecchia identità non può essere recuperata; fai clic su “Reimposta e crea una nuova identità” qui sopra per ricominciare da capo con una nuova passphrase (oppure ripristina da un file di identità cifrata esportato in precedenza su un nuovo dispositivo).',
    learnMore: 'Informazioni su VeilConnect · Scarica per desktop · Self-hosting →',
    errTooShort: 'La passphrase deve contenere almeno {n} caratteri',
    errMismatch: 'Le due passphrase non corrispondono',
    errUnlock: 'Sblocco non riuscito',
    errReset: 'Reimpostazione non riuscita',
    resetConfirm: 'Reimpostare davvero?\n\nLa vecchia identità su questo dispositivo verrà cancellata definitivamente e non potrà essere recuperata (una passphrase non recuperabile è una scelta progettuale per la cifratura end-to-end).\nDopo la cancellazione, potrai creare un’identità nuova di zecca con una nuova passphrase.'
  },
  'hi': {
    loading: 'लोड हो रहा है…',
    promptUnlock: 'इस डिवाइस पर एन्क्रिप्टेड पहचान अनलॉक करने के लिए अपना passphrase दर्ज करें',
    promptCreate: 'पहली बार यहाँ हैं: अपनी पहचान की निजी कुंजी को एन्क्रिप्ट और सुरक्षित करने के लिए एक passphrase सेट करें',
    passphrasePlaceholder: 'Passphrase',
    confirmPlaceholder: 'Passphrase फिर से दर्ज करें',
    showPassphrase: 'Passphrase दिखाएँ',
    processing: 'प्रोसेस हो रहा है…',
    unlockBtn: 'अनलॉक करें',
    createBtn: 'बनाएँ और प्रवेश करें',
    forgotBtn: 'Passphrase भूल गए? रीसेट करें और नई पहचान बनाएँ',
    privacyNote: 'Passphrase इसी browser में एक मास्टर कुंजी बनाता है ताकि आपकी स्थानीय पहचान को डिक्रिप्ट किया जा सके, और यह कभी अपलोड नहीं होता। यदि आप इसे भूल जाते हैं, तो पुरानी पहचान वापस नहीं पाई जा सकती; नई passphrase के साथ नए सिरे से शुरू करने के लिए ऊपर “रीसेट करें और नई पहचान बनाएँ” पर क्लिक करें (या किसी नए डिवाइस पर पहले से निर्यात की गई एन्क्रिप्टेड पहचान फ़ाइल से पुनर्स्थापित करें)।',
    learnMore: 'VeilConnect के बारे में · डेस्कटॉप डाउनलोड करें · स्वयं-होस्ट करें →',
    errTooShort: 'Passphrase कम से कम {n} वर्णों का होना चाहिए',
    errMismatch: 'दोनों passphrase मेल नहीं खाते',
    errUnlock: 'अनलॉक विफल रहा',
    errReset: 'रीसेट विफल रहा',
    resetConfirm: 'क्या वाकई रीसेट करना है?\n\nइस डिवाइस पर मौजूद पुरानी पहचान स्थायी रूप से मिटा दी जाएगी और वापस नहीं पाई जा सकती (एंड-टू-एंड एन्क्रिप्शन के लिए एक अपुनर्प्राप्य passphrase जानबूझकर रखी गई है)।\nमिटाने के बाद, आप एक नई passphrase के साथ बिल्कुल नई पहचान बना सकते हैं।'
  },
  'th': {
    loading: 'กำลังโหลด…',
    promptUnlock: 'กรอกวลีรหัสผ่านของคุณเพื่อปลดล็อกอัตลักษณ์ที่เข้ารหัสไว้บนอุปกรณ์นี้',
    promptCreate: 'มาที่นี่ครั้งแรก: ตั้งวลีรหัสผ่านเพื่อเข้ารหัสและปกป้องคีย์ส่วนตัวของอัตลักษณ์ของคุณ',
    passphrasePlaceholder: 'วลีรหัสผ่าน',
    confirmPlaceholder: 'กรอกวลีรหัสผ่านอีกครั้ง',
    showPassphrase: 'แสดงวลีรหัสผ่าน',
    processing: 'กำลังดำเนินการ…',
    unlockBtn: 'ปลดล็อก',
    createBtn: 'สร้างและเข้าใช้งาน',
    forgotBtn: 'ลืมวลีรหัสผ่าน? รีเซ็ตและสร้างอัตลักษณ์ใหม่',
    privacyNote: 'วลีรหัสผ่านใช้สร้างคีย์หลักภายในเบราว์เซอร์นี้เพื่อถอดรหัสอัตลักษณ์ในเครื่องของคุณ และจะไม่ถูกอัปโหลดออกไป หากคุณลืม จะไม่สามารถกู้คืนอัตลักษณ์เดิมได้ ให้คลิก “รีเซ็ตและสร้างอัตลักษณ์ใหม่” ด้านบนเพื่อเริ่มต้นใหม่ด้วยวลีรหัสผ่านใหม่ (หรือกู้คืนจากไฟล์อัตลักษณ์ที่เข้ารหัสซึ่งเคยส่งออกไว้ก่อนหน้าบนอุปกรณ์ใหม่)',
    learnMore: 'เกี่ยวกับ VeilConnect · ดาวน์โหลดเวอร์ชันเดสก์ท็อป · โฮสต์เอง →',
    errTooShort: 'วลีรหัสผ่านต้องมีความยาวอย่างน้อย {n} อักขระ',
    errMismatch: 'วลีรหัสผ่านทั้งสองไม่ตรงกัน',
    errUnlock: 'ปลดล็อกไม่สำเร็จ',
    errReset: 'รีเซ็ตไม่สำเร็จ',
    resetConfirm: 'ยืนยันการรีเซ็ตหรือไม่?\n\nอัตลักษณ์เดิมบนอุปกรณ์นี้จะถูกลบอย่างถาวรและไม่สามารถกู้คืนได้ (การที่วลีรหัสผ่านกู้คืนไม่ได้นั้นเป็นไปตามการออกแบบเพื่อการเข้ารหัสแบบครบวงจร)\nหลังจากล้างข้อมูลแล้ว คุณสามารถสร้างอัตลักษณ์ใหม่เอี่ยมด้วยวลีรหัสผ่านใหม่ได้'
  },
  'vi': {
    loading: 'Đang tải…',
    promptUnlock: 'Nhập cụm mật khẩu của bạn để mở khóa danh tính được mã hóa trên thiết bị này',
    promptCreate: 'Lần đầu sử dụng: đặt một cụm mật khẩu để mã hóa và bảo vệ khóa riêng tư danh tính của bạn',
    passphrasePlaceholder: 'Cụm mật khẩu',
    confirmPlaceholder: 'Nhập lại cụm mật khẩu',
    showPassphrase: 'Hiện cụm mật khẩu',
    processing: 'Đang xử lý…',
    unlockBtn: 'Mở khóa',
    createBtn: 'Tạo và truy cập',
    forgotBtn: 'Quên cụm mật khẩu? Đặt lại và tạo danh tính mới',
    privacyNote: 'Cụm mật khẩu được dùng để dẫn xuất khóa chính ngay trong trình duyệt này nhằm giải mã danh tính cục bộ của bạn và không bao giờ được tải lên. Nếu bạn quên nó, danh tính cũ sẽ không thể khôi phục; hãy nhấn “Đặt lại và tạo danh tính mới” ở trên để bắt đầu lại với một cụm mật khẩu mới (hoặc khôi phục từ tệp danh tính được mã hóa đã xuất trước đó trên một thiết bị mới).',
    learnMore: 'Giới thiệu về VeilConnect · Tải bản máy tính · Tự lưu trữ →',
    errTooShort: 'Cụm mật khẩu phải có ít nhất {n} ký tự',
    errMismatch: 'Hai cụm mật khẩu không khớp nhau',
    errUnlock: 'Mở khóa thất bại',
    errReset: 'Đặt lại thất bại',
    resetConfirm: 'Bạn chắc chắn muốn đặt lại?\n\nDanh tính cũ trên thiết bị này sẽ bị xóa vĩnh viễn và không thể khôi phục (cụm mật khẩu không thể khôi phục là chủ đích để mã hóa đầu cuối).\nSau khi xóa, bạn có thể tạo một danh tính hoàn toàn mới với một cụm mật khẩu mới.'
  },
};

const RTL_BASE = new Set(['ar', 'he', 'fa', 'ur']);

/** 解析门禁应使用的语言（与 useI18n 选择逻辑一致）：已存偏好 → 浏览器语言 → 基础码匹配 → 默认。 */
export function resolveGateLang(): string {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('veilconnect-language');
      if (saved && GATE_TRANSLATIONS[saved]) return saved;
      const nav = navigator.language || '';
      if (GATE_TRANSLATIONS[nav]) return nav;
      const base = nav.split('-')[0];
      const hit = Object.keys(GATE_TRANSLATIONS).find(c => c === base || c.split('-')[0] === base);
      if (hit) return hit;
    }
  } catch { /* ignore */ }
  return DEFAULT_LANGUAGE;
}

/** 取某语言的门禁文案（缺失时回退基础码 → 默认 → en）。 */
export function gateStrings(lang: string): GateStrings {
  return GATE_TRANSLATIONS[lang]
    || GATE_TRANSLATIONS[lang.split('-')[0]]
    || GATE_TRANSLATIONS[DEFAULT_LANGUAGE]
    || GATE_TRANSLATIONS['en'];
}

/** 该语言是否从右向左书写（门禁页据此设 document.dir）。 */
export function isRtlLang(lang: string): boolean {
  return RTL_BASE.has(lang.split('-')[0]);
}
