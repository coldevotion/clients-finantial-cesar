'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';

interface Props {
  tempToken: string;
  onSuccess: (tokens: any) => void;
  onCancel: () => void;
}

export function TwoFactorPrompt({ tempToken, onSuccess, onCancel }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useBackup, setUseBackup] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post<any>('/auth/2fa/verify-login', { tempToken, totpCode: code });
      onSuccess(res);
    } catch (err: any) {
      setError(err.message ?? 'Código inválido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-3xl mb-4 text-center">🔐</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Verificación en 2 pasos</h2>
        <p className="text-sm text-gray-500 mb-6 text-center">
          {useBackup
            ? 'Ingresa uno de tus códigos de respaldo'
            : 'Ingresa el código de tu app autenticadora'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
            maxLength={useBackup ? 8 : 6}
            placeholder={useBackup ? 'XXXXXXXX' : '000000'}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-3 text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
          <button type="submit" disabled={loading}
            className="w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
        </form>

        <div className="mt-4 text-center space-y-2">
          <button onClick={() => { setUseBackup(!useBackup); setCode(''); setError(''); }}
            className="text-xs text-gray-500 hover:text-gray-700 underline">
            {useBackup ? 'Usar código de app' : 'Usar código de respaldo'}
          </button>
          <br />
          <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
