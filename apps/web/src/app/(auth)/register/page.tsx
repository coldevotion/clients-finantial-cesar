'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { CobrixLogo } from '@/components/CobrixLogo';
import { Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', name: '', tenantName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/register', form);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? 'Error al registrarse');
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
            <h2 className="text-xl font-bold text-text-primary mb-2">Revisa tu correo</h2>
            <p className="text-sm text-text-secondary mb-6">
              Enviamos un enlace de verificación a{' '}
              <span className="font-semibold text-text-primary">{form.email}</span>
            </p>
            <Link href="/login" className="btn-primary inline-flex items-center gap-2 text-sm">
              Volver al login
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
            Crear cuenta
          </h1>
          <p className="text-sm text-text-secondary text-center mb-8">
            Empieza tu prueba gratuita
          </p>

          {error && (
            <div className="mb-5 p-3.5 bg-danger/8 border border-danger/20 rounded-xl text-sm text-danger flex items-center gap-2.5" role="alert">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium text-text-primary">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={set('name')}
                required
                autoComplete="name"
                className="input"
                placeholder="Tu nombre"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="tenantName" className="block text-sm font-medium text-text-primary">
                Empresa
              </label>
              <input
                id="tenantName"
                type="text"
                value={form.tenantName}
                onChange={set('tenantName')}
                required
                autoComplete="organization"
                className="input"
                placeholder="Nombre de tu empresa"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-text-primary">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={set('email')}
                required
                autoComplete="email"
                className="input"
                placeholder="tu@empresa.com"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  required
                  minLength={8}
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
                  Creando cuenta...
                </>
              ) : (
                <>
                  Crear cuenta
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-7">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-primary-500 font-semibold hover:text-primary-600 transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
