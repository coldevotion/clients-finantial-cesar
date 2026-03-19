'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de verificación no encontrado.');
      return;
    }

    api
      .post<void>('/auth/verify-email', { token })
      .then(() => {
        setStatus('success');
        setTimeout(() => router.push('/login'), 3000);
      })
      .catch((err: Error) => {
        setStatus('error');
        setMessage(err.message ?? 'El enlace es inválido o ha expirado.');
      });
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Verificando tu correo...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">¡Email verificado!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Tu correo fue verificado correctamente. Serás redirigido al inicio de sesión en unos segundos.
            </p>
            <Link href="/login" className="text-primary-600 text-sm font-medium hover:underline">
              Ir al inicio de sesión
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verificación fallida</h2>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <Link href="/login" className="text-primary-600 text-sm font-medium hover:underline">
              Volver al inicio de sesión
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
