const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

async function getStoredToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const stored = JSON.parse(localStorage.getItem('wa-auth') ?? '{}');
    return stored?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options?: RequestInit & { _query?: Record<string, string | undefined> }, isRetry = false): Promise<T> {
  // Build path with query params
  let fullPath = path;
  if (options?._query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(options._query)) {
      if (v !== undefined && v !== '') params.set(k, v);
    }
    const qs = params.toString();
    if (qs) fullPath = `${path}?${qs}`;
  }

  if (MOCK_MODE) {
    const { resolveMock } = await import('./mock-data');
    const method = options?.method ?? 'GET';
    const data = resolveMock(method, path); // pass path without query for mock lookup
    await new Promise((r) => setTimeout(r, 120));
    return data as T;
  }

  const token = await getStoredToken();

  const isFormData = options?.body instanceof FormData;

  const res = await fetch(`${API_URL}/api${fullPath}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  // Access token expired → try refresh once
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
