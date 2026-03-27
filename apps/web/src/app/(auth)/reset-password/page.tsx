'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import { CobrixLogo } from '@/components/CobrixLogo';
import { Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ newPassword: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="w-full max-w-md px-4">
        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden animate-slide-up">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-accent" />
          <div className="px-8 pt-10 pb-8 text-center">
            <div className="flex justify-center mb-6">
              <CobrixLogo variant="full" size={36} />
            </div>
            <p className="text-danger text-sm mb-4">Enlace inválido o expirado.</p>
            <Link href="/forgot-password" className="btn-primary inline-flex items-center gap-2 text-sm">
              Solicitar nuevo enlace
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (form.newPassword !== form.confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: form.newPassword });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setError(err.message ?? 'Error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md px-4">
        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden animate-slide-up">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-accent" />
          <div className="px-8 pt-10 pb-8 text-center">
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle size={28} className="text-success" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Contraseña actualizada</h2>
            <p className="text-sm text-text-secondary mb-6">
              Serás redirigido al inicio de sesión en unos segundos.
            </p>
            <Link href="/login" className="btn-primary inline-flex items-center gap-2 text-sm">
              Ir al inicio de sesión
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md px-4">
      <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden animate-slide-up">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-accent" />

        <div className="px-8 pt-10 pb-8">
          <div className="flex justify-center mb-8">
            <CobrixLogo variant="full" size={40} />
          </div>

          <h1 className="text-2xl font-bold text-text-primary text-center mb-1">
            Nueva contraseña
          </h1>
          <p className="text-sm text-text-secondary text-center mb-8">
            Elige una contraseña segura de al menos 8 caracteres.
          </p>

          {error && (
            <div className="mb-5 p-3.5 bg-danger/8 border border-danger/20 rounded-xl text-sm text-danger flex items-center gap-2.5 mb-5" role="alert">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="newPassword" className="block text-sm font-medium text-text-primary">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                  minLength={8}
                  required
                  autoComplete="new-password"
                  className="input pr-10"
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirm" className="block text-sm font-medium text-text-primary">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                  minLength={8}
                  required
                  autoComplete="new-password"
                  className="input pr-10"
                  placeholder="Repite tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                  aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm group"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Guardando...
                </>
              ) : (
                <>
                  Restablecer contraseña
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-7">
            <Link href="/login" className="text-primary-500 font-semibold hover:text-primary-600 transition-colors">
              Volver al inicio de sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
