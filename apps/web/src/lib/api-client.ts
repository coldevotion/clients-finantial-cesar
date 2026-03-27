import { encryptBody, decryptResponse, resetSession } from './crypto-client';
import type { EncryptedPayload } from '@wa/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

// Rutas que NO usan cifrado (auth pública, webhooks, health, handshake crypto)
const PLAIN_PATH_PREFIXES = ['/auth/', '/webhooks/', '/crypto/', '/health'];

function isPlainPath(path: string): boolean {
  return PLAIN_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function getStoredToken(): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.match(/(?:^|;\s*)wa-access-token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  options?: RequestInit & { _query?: Record<string, string | undefined> },
  isRetry = false,
): Promise<T> {
  // Build query string
  let fullPath = path;
  if (options?._query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(options?._query ?? {})) {
      if (v !== undefined && v !== '') params.set(k, v);
    }
    const qs = params.toString();
    if (qs) fullPath = `${path}?${qs}`;
  }

  // Mock mode: bypass real network
  if (MOCK_MODE) {
    const { resolveMock } = await import('./mock-data');
    const method = options?.method ?? 'GET';
    const data = resolveMock(method, path);
    await new Promise((r) => setTimeout(r, 120));
    return data as T;
  }

  const token = getStoredToken();
  const useCrypto = !isPlainPath(path) && typeof crypto !== 'undefined';
  const method = options?.method ?? 'GET';
  const isFormData = options?.body instanceof FormData;
  const hasBody = options?.body != null;

  let body = options?.body;
  const extraHeaders: Record<string, string> = {};

  // ── Cifrar body si corresponde (POST/PUT/PATCH con body JSON) ──────────────
  if (useCrypto && hasBody && !isFormData) {
    const raw = typeof body === 'string' ? JSON.parse(body) : body;
    const { payload, clientPublicKey } = await encryptBody(raw);
    body = JSON.stringify(payload);
    extraHeaders['X-Client-Key'] = clientPublicKey;
  } else if (useCrypto && !isFormData) {
    // GET / DELETE sin body: igualmente enviamos la clave para que el servidor cifre la respuesta
    const { clientPublicKey } = await encryptBody(null).catch(() => ({ clientPublicKey: '' }));
    if (clientPublicKey) extraHeaders['X-Client-Key'] = clientPublicKey;
  }

  const res = await fetch(`${API_URL}/api${fullPath}`, {
    ...options,
    body,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
      ...options?.headers,
    },
  });

  // ── 401: token expirado → refresh y reintentar ─────────────────────────────
  if (res.status === 401 && !isRetry && typeof window !== 'undefined') {
    const body401 = await res.json().catch(() => ({}));

    // El servidor reinició → keypair ECDH cambió → re-negociar sesión crypto
    if (body401?.error?.code === 'SESSION_INVALID') {
      resetSession();
      return request<T>(path, options, true);
    }

    const { refreshAccessToken } = await import('@/store/auth.store');
    const newToken = await refreshAccessToken();
    if (newToken) return request<T>(path, options, true);
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message ?? `Request failed: ${res.status}`);
  }

  const json = await res.json();

  // ── Descifrar respuesta si viene cifrada ───────────────────────────────────
  // Respuesta cifrada: { iv: string, data: string }  (EncryptedPayload directo, sin wrapper)
  // Respuesta plana:   { data: T }  (ResponseInterceptor wrapper)
  if (useCrypto && json && typeof json.iv === 'string' && typeof json.data === 'string') {
    const decrypted = await decryptResponse(json as EncryptedPayload) as { data: T };
    return decrypted.data;
  }

  return json.data as T;
}

export const api = {
  get: <T>(path: string, query?: Record<string, string | undefined>, init?: RequestInit) =>
    request<T>(path, { method: 'GET', _query: query, ...init }),
  post: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), ...init }),
  postForm: <T>(path: string, body: FormData, init?: RequestInit) =>
    request<T>(path, { method: 'POST', body, ...init }),
  put: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body), ...init }),
  patch: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...init }),
  delete: <T>(path: string, init?: RequestInit) => request<T>(path, { method: 'DELETE', ...init }),
};

/** Alias for backwards compat */
export const apiClient = api;
