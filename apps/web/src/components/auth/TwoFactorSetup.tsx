'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';

interface Props {
  enabled: boolean;
  onUpdate: () => void;
}

type Step = 'idle' | 'scan' | 'confirm' | 'backup-codes' | 'disable';

export function TwoFactorSetup({ enabled, onUpdate }: Props) {
  const [step, setStep] = useState<Step>('idle');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [disableForm, setDisableForm] = useState({ password: '', totpCode: '' });

  async function startSetup() {
    setLoading(true);
    setError('');
    try {
      const res = await api.post<any>('/auth/2fa/setup', {});
      setQrCode(res.qrCodeDataUrl);
      setSecret(res.secret);
      setStep('scan');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function confirmSetup() {
    setLoading(true);
    setError('');
    try {
      const res = await api.post<any>('/auth/2fa/confirm', { totpCode });
      setBackupCodes(res.backupCodes);
      setStep('backup-codes');
      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function disable2fa() {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/2fa/disable', disableForm);
      setStep('idle');
      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Autenticación en 2 pasos (2FA)</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Protege tu cuenta con Google Authenticator o Authy
          </p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {enabled ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Idle */}
      {step === 'idle' && !enabled && (
        <button onClick={startSetup} disabled={loading}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
          Activar 2FA
        </button>
      )}

      {step === 'idle' && enabled && (
        <button onClick={() => setStep('disable')}
          className="border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50">
          Desactivar 2FA
        </button>
      )}

      {/* Paso 1: Escanear QR */}
      {step === 'scan' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            1. Abre <strong>Google Authenticator</strong> o <strong>Authy</strong><br />
            2. Escanea el código QR o ingresa la clave manualmente
          </p>
          {qrCode && <img src={qrCode} alt="QR 2FA" className="w-48 h-48 border border-gray-200 rounded-lg" />}
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-500 mb-1">Clave manual:</p>
            <p className="font-mono text-sm text-gray-800 break-all">{secret}</p>
          </div>
          <button onClick={() => setStep('confirm')}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
            Ya lo escaneé →
          </button>
        </div>
      )}

      {/* Paso 2: Confirmar con código */}
      {step === 'confirm' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Ingresa el código de 6 dígitos de tu app para confirmar:</p>
          <input type="text" value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
            maxLength={6} placeholder="000000"
            className="w-36 border border-gray-200 rounded-lg px-3 py-2.5 text-center text-xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <div className="flex gap-2">
            <button onClick={confirmSetup} disabled={loading || totpCode.length !== 6}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Verificando...' : 'Activar 2FA'}
            </button>
            <button onClick={() => setStep('scan')} className="text-sm text-gray-500 hover:text-gray-700 px-3">
              Atrás
            </button>
          </div>
        </div>
      )}

      {/* Paso 3: Backup codes */}
      {step === 'backup-codes' && (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm font-semibold text-yellow-800 mb-2">
              ¡Guarda estos códigos de respaldo!
            </p>
            <p className="text-xs text-yellow-700 mb-3">
              Son de un solo uso. Úsalos si pierdes acceso a tu app autenticadora.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code) => (
                <span key={code} className="font-mono text-sm bg-white border border-yellow-200 rounded px-2 py-1 text-center">
                  {code}
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => setStep('idle')}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
            Los guardé, continuar
          </button>
        </div>
      )}

      {/* Desactivar */}
      {step === 'disable' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Para desactivar el 2FA confirma tu contraseña y código actual:</p>
          <input type="password" value={disableForm.password}
            onChange={(e) => setDisableForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Contraseña" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <input type="text" value={disableForm.totpCode}
            onChange={(e) => setDisableForm((f) => ({ ...f, totpCode: e.target.value.replace(/\D/g, '') }))}
            maxLength={6} placeholder="Código 2FA (000000)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <div className="flex gap-2">
            <button onClick={disable2fa} disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
              {loading ? 'Desactivando...' : 'Desactivar 2FA'}
            </button>
            <button onClick={() => { setStep('idle'); setError(''); }}
              className="text-sm text-gray-500 hover:text-gray-700 px-3">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
