'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api-client';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  tenantId: string | null;
  twoFactorEnabled: boolean;
  isEmailVerified?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;

  setTokens: (access: string, refresh: string, user: AuthUser) => void;
  clearAuth: () => void;
  getAccessToken: () => string | null;
}

const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

// Cambia el rol aquí para probar la UI de admin sin backend:
// 'TENANT_OPERATOR' → usuario normal
// 'TENANT_ADMIN'    → admin con sección Administración visible
// 'SUPER_ADMIN'     → super admin
const MOCK_ROLE = (process.env.NEXT_PUBLIC_MOCK_ROLE ?? 'TENANT_ADMIN') as string;

const MOCK_USER: AuthUser = {
  id: 'mock-user-1',
  email: 'demo@provired.com',
  name: 'Demo Admin',
  role: MOCK_ROLE,
  tenantId: 'mock-tenant-1',
  twoFactorEnabled: false,
  isEmailVerified: true,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:         MOCK_MODE ? MOCK_USER : null,
      accessToken:  MOCK_MODE ? 'mock-token' : null,
      refreshToken: MOCK_MODE ? 'mock-refresh' : null,

      setTokens: (accessToken, refreshToken, user) => {
        if (typeof document !== 'undefined') {
          document.cookie = `wa-access-token=${accessToken}; path=/; max-age=900; SameSite=Lax`;
        }
        set({ accessToken, refreshToken, user });
      },

      clearAuth: () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'wa-access-token=; path=/; max-age=0';
        }
        set({ user: null, accessToken: null, refreshToken: null });
      },

      getAccessToken: () => get().accessToken,
    }),
    {
      name: 'wa-auth',
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function useIsAdmin(): boolean {
  const role = useAuthStore(s => s.user?.role ?? '');
  return role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN';
}

export function useIsSuperAdmin(): boolean {
  return useAuthStore(s => s.user?.role === 'SUPER_ADMIN');
}

// ─── Token refresh ────────────────────────────────────────────────────────────

export async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();
  if (!refreshToken) return null;

  try {
    const res = await api.post<{ accessToken: string; refreshToken: string; user: AuthUser }>(
      '/auth/refresh',
      { refreshToken },
    );
    setTokens(res.accessToken, res.refreshToken, res.user);
    if (typeof document !== 'undefined') {
      document.cookie = `wa-access-token=${res.accessToken}; path=/; max-age=900; SameSite=Lax`;
    }
    return res.accessToken;
  } catch {
    clearAuth();
    return null;
  }
}
