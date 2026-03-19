const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function getStoredToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const stored = JSON.parse(localStorage.getItem('wa-auth') ?? '{}');
    return stored?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options?: RequestInit, isRetry = false): Promise<T> {
  const token = await getStoredToken();

  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  // Access token expirado → intentar refresh una vez
  if (res.status === 401 && !isRetry && typeof window !== 'undefined') {
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
  return json.data as T;
}

export const api = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, { method: 'GET', ...init }),
  post: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), ...init }),
  put: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body), ...init }),
  patch: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...init }),
  delete: <T>(path: string, init?: RequestInit) => request<T>(path, { method: 'DELETE', ...init }),
};
