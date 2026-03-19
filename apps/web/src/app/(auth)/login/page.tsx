'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { TwoFactorPrompt } from '@/components/auth/TwoFactorPrompt';

export default function LoginPage() {
  const router = useRouter();
  const { setTokens } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pending2fa, setPending2fa] = useState<{ tempToken: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<any>('/auth/login', { email, password });
      if (res.requires2fa) {
        setPending2fa({ tempToken: res.tempToken });
        return;
      }
      setTokens(res.accessToken, res.refreshToken, res.user);
      router.push('/');
    } catch (err: any) {
      setError(err.message ?? 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  if (pending2fa) {
    return (
      <TwoFactorPrompt
        tempToken={pending2fa.tempToken}
        onSuccess={(tokens) => {
          setTokens(tokens.accessToken, tokens.refreshToken, tokens.user);
          router.push('/');
        }}
        onCancel={() => setPending2fa(null)}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Iniciar sesión</h1>
        <p className="text-sm text-gray-500 mb-8">Bienvenido de vuelta</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="tu@empresa.com" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <Link href="/forgot-password" className="text-xs text-primary-600 hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-primary-600 font-medium hover:underline">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
