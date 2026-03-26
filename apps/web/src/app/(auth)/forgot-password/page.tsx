'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { ProViredLogo } from '@/components/ProViredLogo';
import { ArrowRight, CheckCircle, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await api.post('/auth/forgot-password', { email }).catch(() => {});
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="w-full max-w-md px-4">
        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden animate-slide-up">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-accent" />
          <div className="px-8 pt-10 pb-8 text-center">
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center">
                <Mail size={28} className="text-primary-500" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Revisa tu correo</h2>
            <p className="text-sm text-text-secondary mb-6">
              Si el correo existe, enviamos un enlace para restablecer tu contraseña.
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
            <ProViredLogo variant="full" size={40} />
          </div>

          <h1 className="text-2xl font-bold text-text-primary text-center mb-1">
            Restablecer contraseña
          </h1>
          <p className="text-sm text-text-secondary text-center mb-8">
            Te enviamos un enlace a tu correo
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="tu@empresa.com"
              />
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
                  Enviando...
                </>
              ) : (
                <>
                  Enviar enlace
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-7">
            <Link href="/login" className="text-primary-500 font-semibold hover:text-primary-600 transition-colors">
              Volver al login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
