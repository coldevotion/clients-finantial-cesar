import type { BirdCredentials } from '@wa/types';

const BIRD_API_BASE = 'https://api.bird.com';
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 5000, 30000];

export class BirdClient {
  private readonly baseUrl: string;

  constructor(private readonly credentials: BirdCredentials) {
    this.baseUrl = `${BIRD_API_BASE}/workspaces/${credentials.workspaceId}`;
  }

  async request<T>(
    method: string,
    path: string,
    body?: unknown,
    attempt = 0,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `AccessKey ${this.credentials.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 429 || (res.status >= 500 && attempt < MAX_RETRIES)) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt] ?? 30000));
      return this.request<T>(method, path, body, attempt + 1);
    }

    if (!res.ok) {
      const error = await res.text();
      throw new BirdApiError(res.status, error);
    }

    return res.json() as Promise<T>;
  }

  get<T>(path: string) {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body: unknown) {
    return this.request<T>('POST', path, body);
  }

  delete<T>(path: string) {
    return this.request<T>('DELETE', path);
  }
}

export class BirdApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly body: string,
  ) {
    super(`Bird API error ${statusCode}: ${body}`);
    this.name = 'BirdApiError';
  }

  get isPermanent(): boolean {
    return this.statusCode === 400 || this.statusCode === 404;
  }
}
