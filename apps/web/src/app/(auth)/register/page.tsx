'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', name: '', tenantName: '' });
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Revisa tu correo</h2>
          <p className="text-sm text-gray-500 mb-6">
            Enviamos un enlace de verificación a <strong>{form.email}</strong>
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Crear cuenta</h1>
        <p className="text-sm text-gray-500 mb-8">Empieza tu prueba gratuita</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input type="text" value={form.name} onChange={set('name')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Tu nombre" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
            <input type="text" value={form.tenantName} onChange={set('tenantName')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Nombre de tu empresa" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input type="email" value={form.email} onChange={set('email')} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="tu@empresa.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input type="password" value={form.password} onChange={set('password')} required minLength={8}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Mínimo 8 caracteres" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-primary-600 font-medium hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
