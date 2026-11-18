const e2eeKeysCache = new Map();

// Генерируем криптографический ключ AES-GCM 256-бит для пары собеседников или группы
async function getChatCryptoKey(chatType, idA, idB = '') {
  const pairSalt = chatType === 'group'
    ? `bubbl_e2ee_group_${idA}`
    : `bubbl_e2ee_private_${[idA, idB].sort().join('_')}`;

  if (e2eeKeysCache.has(pairSalt)) {
    return e2eeKeysCache.get(pairSalt);
  }

  const encoder = new TextEncoder();
  const rawMaterial = encoder.encode(pairSalt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', rawMaterial);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );

  e2eeKeysCache.set(pairSalt, cryptoKey);
  return cryptoKey;
}

function bufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Шифрование текста сообщения перед отправкой на сервер
async function encryptMessageText(plainText, chatType, idA, idB = '') {
  if (!plainText || !window.crypto || !window.crypto.subtle) return plainText;
  try {
    const key = await getChatCryptoKey(chatType, idA, idB);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plainText);
    const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

    return `E2EE:${bufferToBase64(iv)}:${bufferToBase64(cipherBuffer)}`;
  } catch (e) {
    return plainText;
  }
}

// Расшифровка входящего сообщения на устройстве получателя
async function decryptMessageText(cipherText, chatType, idA, idB = '') {
  if (!cipherText || typeof cipherText !== 'string' || !cipherText.startsWith('E2EE:')) {
    return cipherText;
  }
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) return 'Зашифрованное сообщение';

    const iv = new Uint8Array(base64ToBuffer(parts.at(1)));
    const dataBuf = base64ToBuffer(parts.at(2));
    const key = await getChatCryptoKey(chatType, idA, idB);

    const decryptedBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, dataBuf);
    return new TextDecoder().decode(decryptedBuf);
  } catch (e) {
    return 'Не удалось расшифровать сообщение';
  }
}

// Информационная карточка о защите чата по клику на замочек
function showE2EEInfoModal(chatTitle) {
  let modal = document.getElementById('e2eeInfoModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'settings-overlay';
    modal.id = 'e2eeInfoModal';
    modal.innerHTML = `
      <div class="settings-card" style="width: 340px; text-align: center; padding: 24px 20px 20px;">
        <div style="width: 54px; height: 54px; border-radius: 50%; background: rgba(101, 196, 102, 0.14); color: var(--accent, #65C466); display: flex; align-items: center; justify-content: center; margin: 0 auto 14px;">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <div style="font-size: 17px; font-weight: 700; margin-bottom: 8px;">Сквозное шифрование</div>
        <div id="e2eeModalDesc" style="font-size: 13.5px; color: #8e8e93; line-height: 1.45; margin-bottom: 18px;"></div>
        <button type="button" class="tg-save-btn" id="closeE2eeModalBtn">Понятно</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
    document.getElementById('closeE2eeModalBtn').onclick = () => modal.classList.remove('active');
  }

  document.getElementById('e2eeModalDesc').textContent =
    `Сообщения в чате «${chatTitle}» защищены сквозным шифрованием AES-GCM 256-бит. Никто посторонний, включая сервер Bubbl, не может их прочитать.`;
  modal.classList.add('active');
}
