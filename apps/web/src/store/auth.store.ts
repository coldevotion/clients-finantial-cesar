'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api-client';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  tenantId: string | null;
  twoFactorEnabled: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;

  setTokens: (access: string, refresh: string, user: AuthUser) => void;
  clearAuth: () => void;
  getAccessToken: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

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

// Función para refrescar el access token automáticamente
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
