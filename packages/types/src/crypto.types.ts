export interface EncryptedPayload {
  iv: string;   // base64 — 12-byte AES-GCM nonce
  data: string; // base64 — ciphertext + 16-byte GCM auth tag appended
}
