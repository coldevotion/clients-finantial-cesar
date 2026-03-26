"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { ProViredLogo } from "@/components/ProViredLogo";
import { ShieldCheck, ArrowRight } from "lucide-react";

interface Props {
  tempToken: string;
  onSuccess: (tokens: any) => void;
  onCancel: () => void;
}

export function TwoFactorPrompt({ tempToken, onSuccess, onCancel }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [useBackup, setUseBackup] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post<any>("/auth/2fa/verify-login", {
        tempToken,
        totpCode: code,
      });
      onSuccess(res);
    } catch (err: any) {
      setError(err.message ?? "Código inválido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md px-4">
      <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden animate-slide-up">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-accent" />

        <div className="px-8 pt-10 pb-8">
          <div className="flex justify-center mb-6">
            <ProViredLogo variant="full" size={36} />
          </div>

          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center">
              <ShieldCheck size={28} className="text-primary-500" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-text-primary text-center mb-1">
            Verificación en 2 pasos
          </h2>
          <p className="text-sm text-text-secondary text-center mb-6">
            {useBackup
              ? "Ingresa uno de tus códigos de respaldo"
              : "Ingresa el código de tu app autenticadora"}
          </p>

          {error && (
            <div
              className="mb-5 p-3.5 bg-danger/8 border border-danger/20 rounded-xl text-sm text-danger flex items-center gap-2.5 mb-5"
              role="alert"
            >
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
              maxLength={useBackup ? 8 : 6}
              placeholder={useBackup ? "XXXXXXXX" : "000000"}
              required
              autoFocus
              className="w-full border border-border rounded-xl px-4 py-3.5 text-center text-2xl tracking-[0.3em] font-mono input focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm group"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Verificando...
                </>
              ) : (
                <>
                  Verificar
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center space-y-2">
            <button
              onClick={() => {
                setUseBackup(!useBackup);
                setCode("");
                setError("");
              }}
              className="text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors cursor-pointer"
            >
              {useBackup ? "Usar código de app" : "Usar código de respaldo"}
            </button>
            <br />
            <button
              onClick={onCancel}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
