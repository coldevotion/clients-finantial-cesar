'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import { ProViredLogo } from '@/components/ProViredLogo';
import { CheckCircle, XCircle, Mail, ArrowRight } from 'lucide-react';

function VerifyEmailContent() {
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
    <div className="w-full max-w-md px-4">
      <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden animate-slide-up">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-accent" />
        <div className="px-8 pt-10 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <ProViredLogo variant="full" size={36} />
          </div>

          {status === 'loading' && (
            <>
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-text-secondary text-sm">Verificando tu correo...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-5">
                <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle size={28} className="text-success" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">¡Email verificado!</h2>
              <p className="text-sm text-text-secondary mb-6">
                Tu correo fue verificado correctamente. Serás redirigido al inicio de sesión en unos segundos.
              </p>
              <Link href="/login" className="btn-primary inline-flex items-center gap-2 text-sm">
                Ir al inicio de sesión
                <ArrowRight size={14} />
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-5">
                <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center">
                  <XCircle size={28} className="text-danger" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">Verificación fallida</h2>
              <p className="text-sm text-text-secondary mb-6">{message}</p>
              <Link href="/login" className="btn-primary inline-flex items-center gap-2 text-sm">
                Volver al inicio de sesión
                <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
