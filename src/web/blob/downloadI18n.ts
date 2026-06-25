/**
 * 文件下载落地页（DownloadView）的多语言文案 —— 该页由分享链接（#dl=）打开，
 * 无需身份/口令，且在 React i18n 应用之前渲染，故独立维护一份精简文案表。
 * 语言选择与 RTL 判定复用 gateI18n 的 resolveGateLang/isRtlLang（同 15 种语言）。
 * 键集由 tests/downloadI18nParity 对齐测试兜底。
 */
import { DEFAULT_LANGUAGE } from '../../renderer/i18n/languages';

export interface DownloadStrings {
  invalidLink: string;
  title: string;
  subtitle: string;
  decryptedVerified: string;
  savedToDiskSuffix: string;
  redownload: string;
  passwordPlaceholder: string;
  errWithPassword: string;
  errNoPassword: string;
  progress: string;
  processing: string;
  downloadWithPassword: string;
  downloadDecrypt: string;
  keyWarning: string;
}

/** 下载页文案表（同 15 种语言；{pct} 为进度百分比占位符，运行时替换）。 */
export const DOWNLOAD_TRANSLATIONS: Record<string, DownloadStrings> = {
  'zh-CN': {
    invalidLink: '链接无效或缺少密钥。',
    title: '📦 收到一个加密文件',
    subtitle: '通过 VeilConnect 链接分享。文件在你本机解密，服务器只存密文、无密钥解不开。',
    decryptedVerified: '已解密 · 校验通过 ✅',
    savedToDiskSuffix: ' · 已保存到磁盘',
    redownload: '⬇ 重新下载',
    passwordPlaceholder: '提取密码',
    errWithPassword: '下载或解密失败：密码错误，或文件已过期/损坏。',
    errNoPassword: '下载或解密失败：文件可能已过期、被删除或链接损坏。',
    progress: '下载并解密中… {pct}%',
    processing: '处理中…',
    downloadWithPassword: '输入密码并下载',
    downloadDecrypt: '⬇ 下载并解密',
    keyWarning: '下载链接含解密密钥，请勿转发给不该看到此文件的人。'
  },
  'en': {
    invalidLink: 'Invalid link or missing key.',
    title: '📦 You received an encrypted file',
    subtitle: 'Shared via a VeilConnect link. The file is decrypted on your device; the server only stores ciphertext and cannot decrypt it without the key.',
    decryptedVerified: 'Decrypted · Verified ✅',
    savedToDiskSuffix: ' · Saved to disk',
    redownload: '⬇ Download again',
    passwordPlaceholder: 'Download password',
    errWithPassword: 'Download or decryption failed: wrong password, or the file has expired / is corrupted.',
    errNoPassword: 'Download or decryption failed: the file may have expired, been deleted, or the link is broken.',
    progress: 'Downloading & decrypting… {pct}%',
    processing: 'Processing…',
    downloadWithPassword: 'Enter password & download',
    downloadDecrypt: '⬇ Download & decrypt',
    keyWarning: 'The download link contains the decryption key — do not forward it to anyone who should not see this file.'
  },
  'ja': {
    invalidLink: 'リンクが無効か、鍵がありません。',
    title: '📦 暗号化されたファイルが届きました',
    subtitle: 'VeilConnect リンクで共有されました。ファイルはお使いのデバイス上で復号されます。サーバーは暗号文のみを保存し、鍵なしでは復号できません。',
    decryptedVerified: '復号完了 · 検証済み ✅',
    savedToDiskSuffix: ' · ディスクに保存しました',
    redownload: '⬇ もう一度ダウンロード',
    passwordPlaceholder: 'ダウンロードパスワード',
    errWithPassword: 'ダウンロードまたは復号に失敗しました。パスワードが間違っているか、ファイルの有効期限が切れている、または破損しています。',
    errNoPassword: 'ダウンロードまたは復号に失敗しました。ファイルの有効期限切れ、削除、またはリンクが壊れている可能性があります。',
    progress: 'ダウンロードして復号しています… {pct}%',
    processing: '処理中…',
    downloadWithPassword: 'パスワードを入力してダウンロード',
    downloadDecrypt: '⬇ ダウンロードして復号',
    keyWarning: 'ダウンロードリンクには復号鍵が含まれています。このファイルを見せるべきでない相手には転送しないでください。'
  },
  'es': {
    invalidLink: 'Enlace no válido o falta la clave.',
    title: '📦 Has recibido un archivo cifrado',
    subtitle: 'Compartido mediante un enlace de VeilConnect. El archivo se descifra en tu dispositivo; el servidor solo almacena texto cifrado y no puede descifrarlo sin la clave.',
    decryptedVerified: 'Descifrado · Verificado ✅',
    savedToDiskSuffix: ' · Guardado en el disco',
    redownload: '⬇ Descargar de nuevo',
    passwordPlaceholder: 'Contraseña de descarga',
    errWithPassword: 'Error al descargar o descifrar: contraseña incorrecta, o el archivo ha caducado / está dañado.',
    errNoPassword: 'Error al descargar o descifrar: es posible que el archivo haya caducado, se haya eliminado o que el enlace esté roto.',
    progress: 'Descargando y descifrando… {pct}%',
    processing: 'Procesando…',
    downloadWithPassword: 'Introduce la contraseña y descarga',
    downloadDecrypt: '⬇ Descargar y descifrar',
    keyWarning: 'El enlace de descarga contiene la clave de descifrado: no se lo reenvíes a nadie que no deba ver este archivo.'
  },
  'zh-TW': {
    invalidLink: '連結無效或缺少金鑰。',
    title: '📦 您收到一個加密檔案',
    subtitle: '透過 VeilConnect 連結分享。檔案在您的裝置上解密；伺服器僅儲存密文，沒有金鑰便無法解密。',
    decryptedVerified: '已解密 · 已驗證 ✅',
    savedToDiskSuffix: ' · 已儲存至磁碟',
    redownload: '⬇ 重新下載',
    passwordPlaceholder: '下載密碼',
    errWithPassword: '下載或解密失敗：密碼錯誤,或檔案已過期 / 已損毀。',
    errNoPassword: '下載或解密失敗：檔案可能已過期、已刪除,或連結已失效。',
    progress: '正在下載並解密… {pct}%',
    processing: '處理中…',
    downloadWithPassword: '輸入密碼並下載',
    downloadDecrypt: '⬇ 下載並解密',
    keyWarning: '下載連結中包含解密金鑰,請勿轉發給不應看到此檔案的任何人。'
  },
  'ko': {
    invalidLink: '링크가 잘못되었거나 키가 없습니다.',
    title: '📦 암호화된 파일을 받았습니다',
    subtitle: 'VeilConnect 링크로 공유되었습니다. 파일은 사용자 기기에서 복호화되며, 서버는 암호문만 저장하고 키 없이는 복호화할 수 없습니다.',
    decryptedVerified: '복호화됨 · 검증됨 ✅',
    savedToDiskSuffix: ' · 디스크에 저장됨',
    redownload: '⬇ 다시 다운로드',
    passwordPlaceholder: '다운로드 비밀번호',
    errWithPassword: '다운로드 또는 복호화에 실패했습니다: 비밀번호가 틀렸거나, 파일이 만료되었거나 손상되었습니다.',
    errNoPassword: '다운로드 또는 복호화에 실패했습니다: 파일이 만료되었거나 삭제되었거나 링크가 손상되었을 수 있습니다.',
    progress: '다운로드 및 복호화 중… {pct}%',
    processing: '처리 중…',
    downloadWithPassword: '비밀번호 입력 후 다운로드',
    downloadDecrypt: '⬇ 다운로드 및 복호화',
    keyWarning: '다운로드 링크에는 복호화 키가 포함되어 있습니다 — 이 파일을 보면 안 되는 사람에게 전달하지 마세요.'
  },
  'fr': {
    invalidLink: 'Lien invalide ou clé manquante.',
    title: '📦 Vous avez reçu un fichier chiffré',
    subtitle: 'Partagé via un lien VeilConnect. Le fichier est déchiffré sur votre appareil ; le serveur ne stocke que le texte chiffré et ne peut pas le déchiffrer sans la clé.',
    decryptedVerified: 'Déchiffré · Vérifié ✅',
    savedToDiskSuffix: ' · Enregistré sur le disque',
    redownload: '⬇ Télécharger à nouveau',
    passwordPlaceholder: 'Mot de passe de téléchargement',
    errWithPassword: 'Échec du téléchargement ou du déchiffrement : mot de passe incorrect, ou le fichier a expiré / est corrompu.',
    errNoPassword: 'Échec du téléchargement ou du déchiffrement : le fichier a peut-être expiré, été supprimé, ou le lien est rompu.',
    progress: 'Téléchargement et déchiffrement en cours… {pct}%',
    processing: 'Traitement en cours…',
    downloadWithPassword: 'Saisir le mot de passe et télécharger',
    downloadDecrypt: '⬇ Télécharger et déchiffrer',
    keyWarning: 'Le lien de téléchargement contient la clé de déchiffrement — ne le transférez à personne qui ne devrait pas voir ce fichier.'
  },
  'de': {
    invalidLink: 'Ungültiger Link oder fehlender Schlüssel.',
    title: '📦 Sie haben eine verschlüsselte Datei erhalten',
    subtitle: 'Geteilt über einen VeilConnect-Link. Die Datei wird auf Ihrem Gerät entschlüsselt; der Server speichert nur den Chiffretext und kann ihn ohne den Schlüssel nicht entschlüsseln.',
    decryptedVerified: 'Entschlüsselt · Verifiziert ✅',
    savedToDiskSuffix: ' · Auf Festplatte gespeichert',
    redownload: '⬇ Erneut herunterladen',
    passwordPlaceholder: 'Download-Passwort',
    errWithPassword: 'Download oder Entschlüsselung fehlgeschlagen: falsches Passwort, oder die Datei ist abgelaufen / beschädigt.',
    errNoPassword: 'Download oder Entschlüsselung fehlgeschlagen: die Datei ist möglicherweise abgelaufen, wurde gelöscht oder der Link ist defekt.',
    progress: 'Wird heruntergeladen & entschlüsselt… {pct}%',
    processing: 'Wird verarbeitet…',
    downloadWithPassword: 'Passwort eingeben & herunterladen',
    downloadDecrypt: '⬇ Herunterladen & entschlüsseln',
    keyWarning: 'Der Download-Link enthält den Entschlüsselungsschlüssel — leiten Sie ihn nicht an Personen weiter, die diese Datei nicht sehen sollen.'
  },
  'ru': {
    invalidLink: 'Неверная ссылка или отсутствует ключ.',
    title: '📦 Вы получили зашифрованный файл',
    subtitle: 'Передано по ссылке VeilConnect. Файл расшифровывается на вашем устройстве; сервер хранит только шифротекст и не может расшифровать его без ключа.',
    decryptedVerified: 'Расшифровано · Проверено ✅',
    savedToDiskSuffix: ' · Сохранено на диск',
    redownload: '⬇ Скачать снова',
    passwordPlaceholder: 'Пароль для скачивания',
    errWithPassword: 'Не удалось скачать или расшифровать: неверный пароль, либо файл истёк / повреждён.',
    errNoPassword: 'Не удалось скачать или расшифровать: возможно, файл истёк, был удалён, или ссылка повреждена.',
    progress: 'Скачивание и расшифровка… {pct}%',
    processing: 'Обработка…',
    downloadWithPassword: 'Введите пароль и скачайте',
    downloadDecrypt: '⬇ Скачать и расшифровать',
    keyWarning: 'Ссылка для скачивания содержит ключ расшифровки — не пересылайте её тем, кто не должен видеть этот файл.'
  },
  'ar': {
    invalidLink: 'رابط غير صالح أو المفتاح مفقود.',
    title: '📦 لقد استلمت ملفًا مشفّرًا',
    subtitle: 'تمت مشاركته عبر رابط VeilConnect. يُفكّ تشفير الملف على جهازك؛ ولا يخزّن الخادم سوى النص المشفّر ولا يمكنه فكّ تشفيره من دون المفتاح.',
    decryptedVerified: 'تم فكّ التشفير · تم التحقق ✅',
    savedToDiskSuffix: ' · تم الحفظ على القرص',
    redownload: '⬇ التنزيل مرة أخرى',
    passwordPlaceholder: 'كلمة مرور التنزيل',
    errWithPassword: 'فشل التنزيل أو فكّ التشفير: كلمة المرور خاطئة، أو انتهت صلاحية الملف أو أنه تالف.',
    errNoPassword: 'فشل التنزيل أو فكّ التشفير: ربما انتهت صلاحية الملف، أو حُذف، أو أن الرابط معطّل.',
    progress: 'جارٍ التنزيل وفكّ التشفير… {pct}٪',
    processing: 'جارٍ المعالجة…',
    downloadWithPassword: 'أدخل كلمة المرور ثم نزّل',
    downloadDecrypt: '⬇ التنزيل وفكّ التشفير',
    keyWarning: 'يحتوي رابط التنزيل على مفتاح فكّ التشفير؛ فلا تعيد توجيهه إلى أي شخص لا ينبغي له الاطّلاع على هذا الملف.'
  },
  'pt': {
    invalidLink: 'Link inválido ou chave ausente.',
    title: '📦 Você recebeu um arquivo criptografado',
    subtitle: 'Compartilhado por meio de um link do VeilConnect. O arquivo é descriptografado no seu dispositivo; o servidor armazena apenas o texto cifrado e não consegue descriptografá-lo sem a chave.',
    decryptedVerified: 'Descriptografado · Verificado ✅',
    savedToDiskSuffix: ' · Salvo no disco',
    redownload: '⬇ Baixar novamente',
    passwordPlaceholder: 'Senha de download',
    errWithPassword: 'Falha no download ou na descriptografia: senha incorreta, ou o arquivo expirou / está corrompido.',
    errNoPassword: 'Falha no download ou na descriptografia: o arquivo pode ter expirado, sido excluído, ou o link está quebrado.',
    progress: 'Baixando e descriptografando… {pct}%',
    processing: 'Processando…',
    downloadWithPassword: 'Digite a senha e baixe',
    downloadDecrypt: '⬇ Baixar e descriptografar',
    keyWarning: 'O link de download contém a chave de descriptografia — não o encaminhe para ninguém que não deva ver este arquivo.'
  },
  'it': {
    invalidLink: 'Link non valido o chiave mancante.',
    title: '📦 Hai ricevuto un file cifrato',
    subtitle: 'Condiviso tramite un link VeilConnect. Il file viene decifrato sul tuo dispositivo; il server memorizza solo il testo cifrato e non può decifrarlo senza la chiave.',
    decryptedVerified: 'Decifrato · Verificato ✅',
    savedToDiskSuffix: ' · Salvato su disco',
    redownload: '⬇ Scarica di nuovo',
    passwordPlaceholder: 'Password di download',
    errWithPassword: 'Download o decifratura non riusciti: password errata, oppure il file è scaduto / è danneggiato.',
    errNoPassword: 'Download o decifratura non riusciti: il file potrebbe essere scaduto, essere stato eliminato, oppure il link è danneggiato.',
    progress: 'Download e decifratura in corso… {pct}%',
    processing: 'Elaborazione in corso…',
    downloadWithPassword: 'Inserisci la password e scarica',
    downloadDecrypt: '⬇ Scarica e decifra',
    keyWarning: 'Il link di download contiene la chiave di decifratura: non inoltrarlo a nessuno che non debba vedere questo file.'
  },
  'hi': {
    invalidLink: 'अमान्य लिंक या कुंजी मौजूद नहीं है।',
    title: '📦 आपको एक एन्क्रिप्टेड फ़ाइल मिली है',
    subtitle: 'VeilConnect लिंक के ज़रिए साझा की गई। फ़ाइल आपके डिवाइस पर ही डिक्रिप्ट होती है; सर्वर केवल साइफरटेक्स्ट संग्रहीत करता है और कुंजी के बिना उसे डिक्रिप्ट नहीं कर सकता।',
    decryptedVerified: 'डिक्रिप्ट किया गया · सत्यापित ✅',
    savedToDiskSuffix: ' · डिस्क पर सहेजा गया',
    redownload: '⬇ फिर से डाउनलोड करें',
    passwordPlaceholder: 'डाउनलोड पासवर्ड',
    errWithPassword: 'डाउनलोड या डिक्रिप्शन विफल रहा: गलत पासवर्ड, या फ़ाइल समाप्त हो चुकी है / क्षतिग्रस्त है।',
    errNoPassword: 'डाउनलोड या डिक्रिप्शन विफल रहा: हो सकता है फ़ाइल समाप्त हो गई हो, हटा दी गई हो, या लिंक टूट गया हो।',
    progress: 'डाउनलोड और डिक्रिप्ट हो रहा है… {pct}%',
    processing: 'प्रोसेस हो रहा है…',
    downloadWithPassword: 'पासवर्ड डालें और डाउनलोड करें',
    downloadDecrypt: '⬇ डाउनलोड और डिक्रिप्ट करें',
    keyWarning: 'डाउनलोड लिंक में डिक्रिप्शन कुंजी शामिल है — इसे किसी ऐसे व्यक्ति को न भेजें जिसे यह फ़ाइल नहीं देखनी चाहिए।'
  },
  'th': {
    invalidLink: 'ลิงก์ไม่ถูกต้องหรือไม่มีคีย์',
    title: '📦 คุณได้รับไฟล์ที่เข้ารหัส',
    subtitle: 'แชร์ผ่านลิงก์ VeilConnect ไฟล์จะถูกถอดรหัสบนอุปกรณ์ของคุณ เซิร์ฟเวอร์เก็บเพียงข้อมูลที่เข้ารหัสไว้และไม่สามารถถอดรหัสได้หากไม่มีคีย์',
    decryptedVerified: 'ถอดรหัสแล้ว · ยืนยันแล้ว ✅',
    savedToDiskSuffix: ' · บันทึกลงดิสก์แล้ว',
    redownload: '⬇ ดาวน์โหลดอีกครั้ง',
    passwordPlaceholder: 'รหัสผ่านดาวน์โหลด',
    errWithPassword: 'ดาวน์โหลดหรือถอดรหัสไม่สำเร็จ: รหัสผ่านไม่ถูกต้อง หรือไฟล์หมดอายุ / เสียหาย',
    errNoPassword: 'ดาวน์โหลดหรือถอดรหัสไม่สำเร็จ: ไฟล์อาจหมดอายุ ถูกลบ หรือลิงก์เสียหาย',
    progress: 'กำลังดาวน์โหลดและถอดรหัส… {pct}%',
    processing: 'กำลังดำเนินการ…',
    downloadWithPassword: 'กรอกรหัสผ่านและดาวน์โหลด',
    downloadDecrypt: '⬇ ดาวน์โหลดและถอดรหัส',
    keyWarning: 'ลิงก์ดาวน์โหลดมีคีย์สำหรับถอดรหัส อย่าส่งต่อให้ผู้ที่ไม่ควรเห็นไฟล์นี้'
  },
  'vi': {
    invalidLink: 'Liên kết không hợp lệ hoặc thiếu khóa.',
    title: '📦 Bạn đã nhận được một tệp được mã hóa',
    subtitle: 'Được chia sẻ qua liên kết VeilConnect. Tệp được giải mã trên thiết bị của bạn; máy chủ chỉ lưu trữ bản mã và không thể giải mã nếu không có khóa.',
    decryptedVerified: 'Đã giải mã · Đã xác minh ✅',
    savedToDiskSuffix: ' · Đã lưu vào đĩa',
    redownload: '⬇ Tải lại',
    passwordPlaceholder: 'Mật khẩu tải xuống',
    errWithPassword: 'Tải xuống hoặc giải mã thất bại: sai mật khẩu, hoặc tệp đã hết hạn / bị hỏng.',
    errNoPassword: 'Tải xuống hoặc giải mã thất bại: tệp có thể đã hết hạn, bị xóa, hoặc liên kết bị hỏng.',
    progress: 'Đang tải xuống và giải mã… {pct}%',
    processing: 'Đang xử lý…',
    downloadWithPassword: 'Nhập mật khẩu và tải xuống',
    downloadDecrypt: '⬇ Tải xuống và giải mã',
    keyWarning: 'Liên kết tải xuống chứa khóa giải mã — đừng chuyển tiếp cho bất kỳ ai không được phép xem tệp này.'
  },
};

/** 取某语言的下载页文案（缺失时回退基础码 → 默认 → en）。 */
export function downloadStrings(lang: string): DownloadStrings {
  return DOWNLOAD_TRANSLATIONS[lang]
    || DOWNLOAD_TRANSLATIONS[lang.split('-')[0]]
    || DOWNLOAD_TRANSLATIONS[DEFAULT_LANGUAGE]
    || DOWNLOAD_TRANSLATIONS['en'];
}
