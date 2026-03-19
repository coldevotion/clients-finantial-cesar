'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-5xl mb-4">✉️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Revisa tu correo</h2>
          <p className="text-sm text-gray-500 mb-6">
            Si el correo existe, enviamos un enlace para restablecer tu contraseña.
          </p>
          <Link href="/login" className="text-primary-600 text-sm font-medium hover:underline">
            Volver al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Restablecer contraseña</h1>
        <p className="text-sm text-gray-500 mb-8">Te enviamos un enlace a tu correo</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="tu@empresa.com" />
          <button type="submit" disabled={loading}
            className="w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/login" className="text-primary-600 hover:underline">Volver al login</Link>
        </p>
      </div>
    </div>
  );
}
