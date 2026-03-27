'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import { SessionsList } from '@/components/auth/SessionsList';
import { User, Shield, Monitor, CheckCircle2, AlertCircle } from 'lucide-react';

// ─── Avatar with initials ─────────────────────────────────────────────────────

function Avatar({ name, email }: { name?: string; email?: string }) {
  const source = name || email || '?';
  const initials = source
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-lg">
      <span className="text-xl font-bold text-white">{initials}</span>
    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabButton({
  active, icon: Icon, label, onClick,
}: { active: boolean; icon: React.FC<any>; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 cursor-pointer
        ${active
          ? 'bg-navy-700 text-white'
          : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800'
        }`}
    >
      <Icon size={15} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sessions'>('profile');
  const [name, setName] = useState('');
  const [nameInitialized, setNameInitialized] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<any>('/users/me'),
    select: (data) => {
      if (!nameInitialized && data?.name != null) {
        setName(data.name);
        setNameInitialized(true);
      }
      return data;
    },
  });

  const updateProfile = useMutation({
    mutationFn: (data: any) => api.patch('/users/me', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });

  const changePassword = useMutation({
    mutationFn: (data: any) => api.post('/auth/change-password', data),
    onSuccess: () => {
      setPasswordSuccess('Contraseña actualizada correctamente');
      setPasswordForm({ currentPassword: '', newPassword: '', confirm: '' });
      setPasswordError('');
    },
    onError: (err: any) => {
      setPasswordError(err.message);
      setPasswordSuccess('');
    },
  });

  function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirm) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }
    changePassword.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  }

  const tabs = [
    { key: 'profile',  label: 'Perfil',           icon: User    },
    { key: 'security', label: 'Seguridad',         icon: Shield  },
    { key: 'sessions', label: 'Sesiones activas',  icon: Monitor },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Header card ─────────────────────────────────────────── */}
      <div className="bg-navy-900 rounded-2xl border border-navy-700 px-6 py-5 flex items-center gap-5">
        <Avatar name={profile?.name} email={profile?.email} />
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-white truncate">
            {profile?.name || 'Sin nombre'}
          </h1>
          <p className="text-sm text-slate-400 truncate">{profile?.email}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {profile?.isEmailVerified ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                <CheckCircle2 size={10} />
                Email verificado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                <AlertCircle size={10} />
                Email no verificado
              </span>
            )}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-500/15 text-primary-400 border border-primary-500/25">
              {profile?.role}
            </span>
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-navy-900 border border-navy-700 rounded-xl">
        {tabs.map(tab => (
          <TabButton
            key={tab.key}
            active={activeTab === tab.key}
            icon={tab.icon}
            label={tab.label}
            onClick={() => setActiveTab(tab.key)}
          />
        ))}
      </div>

      {/* ── Perfil ──────────────────────────────────────────────── */}
      {activeTab === 'profile' && profile && (
        <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 space-y-5">
          <Field label="Nombre">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Tu nombre completo"
            />
          </Field>
          <Field label="Correo electrónico">
            <input
              type="email"
              value={profile.email}
              disabled
              className="input opacity-50 cursor-not-allowed"
            />
          </Field>
          <div className="pt-1">
            <button
              onClick={() => updateProfile.mutate({ name })}
              disabled={updateProfile.isPending}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {updateProfile.isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      )}

      {/* ── Seguridad ───────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <div className="space-y-5">
          <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-5">Cambiar contraseña</h3>

            {passwordError && (
              <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger flex items-center gap-2">
                <AlertCircle size={14} />
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400 flex items-center gap-2">
                <CheckCircle2 size={14} />
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              {(['currentPassword', 'newPassword', 'confirm'] as const).map((field) => (
                <Field
                  key={field}
                  label={
                    field === 'currentPassword' ? 'Contraseña actual'
                    : field === 'newPassword'   ? 'Nueva contraseña'
                    : 'Confirmar nueva contraseña'
                  }
                >
                  <input
                    type="password"
                    value={passwordForm[field]}
                    onChange={(e) => setPasswordForm(f => ({ ...f, [field]: e.target.value }))}
                    minLength={field !== 'currentPassword' ? 8 : undefined}
                    className="input"
                    placeholder="••••••••"
                  />
                </Field>
              ))}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={changePassword.isPending}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {changePassword.isPending ? 'Actualizando...' : 'Actualizar contraseña'}
                </button>
              </div>
            </form>
          </div>

          {profile && (
            <TwoFactorSetup
              enabled={profile.twoFactorEnabled}
              onUpdate={() => queryClient.invalidateQueries({ queryKey: ['profile'] })}
            />
          )}
        </div>
      )}

      {/* ── Sesiones ────────────────────────────────────────────── */}
      {activeTab === 'sessions' && <SessionsList />}
    </div>
  );
}
