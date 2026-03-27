import { Injectable } from '@nestjs/common';
import { createECDH, createDecipheriv, createCipheriv, randomBytes } from 'crypto';
import type { EncryptedPayload } from '@wa/types';

@Injectable()
export class CryptoService {
  // Keypair ECDH P-256 generado una vez al arrancar el servidor.
  // Si el servidor se reinicia, el keypair cambia y los clientes reciben
  // SESSION_INVALID (ver middleware) para forzar un nuevo handshake.
  private readonly ecdh = createECDH('prime256v1');

  // Cache: clientPublicKeyBase64 → sharedSecret (32 bytes AES-256 key)
  // El sharedSecret de ECDH P-256 son exactamente 32 bytes — úsalo directo como AES-256 key.
  private readonly sessionKeys = new Map<string, Buffer>();

  constructor() {
    this.ecdh.generateKeys();
  }

  getServerPublicKey(): string {
    return this.ecdh.getPublicKey('base64');
  }

  deriveSessionKey(clientPublicKeyBase64: string): Buffer {
    const cached = this.sessionKeys.get(clientPublicKeyBase64);
    if (cached) return cached;

    const clientPublicKey = Buffer.from(clientPublicKeyBase64, 'base64');
    // computeSecret retorna el x-coordinate del punto compartido (32 bytes en P-256)
    // Web Crypto deriveKey con ECDH usa este mismo valor directo como clave AES-256
    const sharedSecret = this.ecdh.computeSecret(clientPublicKey);
    this.sessionKeys.set(clientPublicKeyBase64, sharedSecret);
    return sharedSecret;
  }

  decrypt(aesKey: Buffer, payload: EncryptedPayload): unknown {
    const iv = Buffer.from(payload.iv, 'base64');
    const combined = Buffer.from(payload.data, 'base64');

    // Web Crypto AES-GCM appends the 16-byte auth tag at the end of ciphertext
    const authTag = combined.subarray(combined.length - 16);
    const ciphertext = combined.subarray(0, combined.length - 16);

    const decipher = createDecipheriv('aes-256-gcm', aesKey, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
  }

  encrypt(aesKey: Buffer, data: unknown): EncryptedPayload {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', aesKey, iv);
    const json = JSON.stringify(data);
    const ciphertext = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag(); // 16 bytes
    const combined = Buffer.concat([ciphertext, authTag]);

    return {
      iv: iv.toString('base64'),
      data: combined.toString('base64'),
    };
  }
}
