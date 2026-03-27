/**
 * crypto-client.ts — ECDH P-256 + AES-256-GCM payload encryption (browser)
 *
 * Flujo:
 * 1. initSession(): fetch server pubkey → ECDH handshake → shared AES-256 key en memoria
 * 2. encryptBody(data): cifra cualquier objeto → { iv, data } + clientPublicKey para el header
 * 3. decryptResponse(payload): descifra la respuesta del servidor
 * 4. resetSession(): fuerza nuevo handshake (llamado si el servidor devuelve SESSION_INVALID)
 */

import type { EncryptedPayload } from '@wa/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ─── Helpers base64 ────────────────────────────────────────────────────────────

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(str: string): ArrayBuffer {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// ─── Estado de sesión (en memoria — se pierde al refrescar la página intencional) ──

interface CryptoSession {
  aesKey: CryptoKey;
  clientPublicKeyBase64: string;
}

let session: CryptoSession | null = null;
let initPromise: Promise<CryptoSession> | null = null;

// ─── Handshake ECDH ────────────────────────────────────────────────────────────

async function buildSession(): Promise<CryptoSession> {
  // 1. Obtener clave pública del servidor
  const res = await fetch(`${API_URL}/api/crypto/pubkey`);
  if (!res.ok) throw new Error('Failed to fetch server public key');
  const json = await res.json();
  const serverPublicKeyBase64: string = json.data.publicKey;

  // 2. Importar clave pública del servidor (formato raw: 65 bytes P-256 sin comprimir)
  const serverPublicKey = await crypto.subtle.importKey(
    'raw',
    fromBase64(serverPublicKeyBase64),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  );

  // 3. Generar keypair efímero del cliente
  const clientKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,   // exportable para enviar la clave pública al servidor
    ['deriveKey'],
  );

  // 4. Exportar clave pública del cliente (raw = 65 bytes uncompressed)
  const clientPublicKeyBuffer = await crypto.subtle.exportKey('raw', clientKeyPair.publicKey);
  const clientPublicKeyBase64 = toBase64(clientPublicKeyBuffer);

  // 5. Derivar shared AES-256-GCM key
  // Web Crypto ECDH deriveKey usa el x-coordinate del shared point como keyMaterial (32 bytes P-256)
  // Node.js crypto.ecdh.computeSecret() retorna exactamente ese mismo valor → claves idénticas
  const aesKey = await crypto.subtle.deriveKey(
    { name: 'ECDH', public: serverPublicKey },
    clientKeyPair.privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );

  return { aesKey, clientPublicKeyBase64 };
}

export async function initSession(): Promise<CryptoSession> {
  if (session) return session;
  if (initPromise) return initPromise;

  initPromise = buildSession().then((s) => {
    session = s;
    return s;
  }).catch((err) => {
    initPromise = null; // permitir reintento si falla
    throw err;
  });

  return initPromise;
}

export function resetSession(): void {
  session = null;
  initPromise = null;
}

// ─── Cifrado de request body ───────────────────────────────────────────────────

export async function encryptBody(
  data: unknown,
): Promise<{ payload: EncryptedPayload; clientPublicKey: string }> {
  const { aesKey, clientPublicKeyBase64 } = await initSession();

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));

  // AES-GCM en Web Crypto: ciphertext output ya incluye el auth tag (16 bytes) al final
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encoded);

  return {
    payload: {
      iv: toBase64(iv.buffer as ArrayBuffer),
      data: toBase64(ciphertext),
    },
    clientPublicKey: clientPublicKeyBase64,
  };
}

// ─── Descifrado de response ────────────────────────────────────────────────────

export async function decryptResponse(payload: EncryptedPayload): Promise<unknown> {
  const { aesKey } = await initSession();

  const iv = fromBase64(payload.iv);
  const data = fromBase64(payload.data); // ciphertext + auth tag

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, data);
  return JSON.parse(new TextDecoder().decode(decrypted));
}
