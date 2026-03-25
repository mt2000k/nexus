const ENCRYPTION_ALGO = 'AES-GCM';
const KEY_LENGTH = 256;

export async function generateRoomKey() {
  const key = await crypto.subtle.generateKey(
    { name: ENCRYPTION_ALGO, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
  return key;
}

export async function exportKey(key) {
  const exported = await crypto.subtle.exportKey('jwk', key);
  return JSON.stringify(exported);
}

export async function importKey(jwkString) {
  const jwk = JSON.parse(jwkString);
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: ENCRYPTION_ALGO, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptMessage(message, key) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: ENCRYPTION_ALGO, iv },
    key,
    data
  );

  return {
    encryptedMessage: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv),
  };
}

export async function decryptMessage(encryptedData, ivData, key) {
  try {
    const encrypted = base64ToArrayBuffer(encryptedData);
    const iv = base64ToArrayBuffer(ivData);

    const decrypted = await crypto.subtle.decrypt(
      { name: ENCRYPTION_ALGO, iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch {
    return '[Unable to decrypt message]';
  }
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
