'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { TwoFactorPrompt } from '@/components/auth/TwoFactorPrompt';
import { CobrixLogo } from '@/components/CobrixLogo';
import { Eye, EyeOff, ArrowRight, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setTokens } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="w-full max-w-md px-4">
      <div className="relative bg-white/85 dark:bg-navy-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 dark:border-navy-600/60 overflow-hidden animate-slide-up">

        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-600 via-primary-400 to-primary-500" />

        <div className="px-8 pt-10 pb-8">

          {/* Logo + heading */}
          <div className="flex flex-col items-center mb-8">
            <CobrixLogo variant="full" size={40} />
            <div className="mt-5 text-center">
              <h1 className="text-2xl font-bold text-text-primary dark:text-slate-100 tracking-tight">
                Acceder a la plataforma
              </h1>
              <p className="text-sm text-text-muted mt-1">
                Ingresa tus credenciales para continuar
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-5 p-3.5 bg-danger/8 border border-danger/20 rounded-xl text-sm text-danger flex items-center gap-2.5"
              role="alert"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-text-primary">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="input"
                placeholder="usuario@empresa.com"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                  Contraseña
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="input pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm group mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verificando...
                </>
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Internal platform notice — replaces register link */}
          <div className="mt-7 flex items-center justify-center gap-1.5 text-xs text-text-muted">
            <Lock size={11} className="flex-shrink-0" />
            <span>Plataforma de acceso restringido</span>
          </div>
        </div>
      </div>
    </div>
  );
}
