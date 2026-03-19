'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import { SessionsList } from '@/components/auth/SessionsList';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sessions'>('profile');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<any>('/users/me'),
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
    { key: 'profile', label: 'Perfil' },
    { key: 'security', label: 'Seguridad' },
    { key: 'sessions', label: 'Sesiones activas' },
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi cuenta</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Perfil */}
      {activeTab === 'profile' && profile && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input type="text" defaultValue={profile.name ?? ''} id="name"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input type="email" value={profile.email} disabled
              className="w-full border border-gray-100 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${profile.isEmailVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {profile.isEmailVerified ? 'Email verificado' : 'Email no verificado'}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
              {profile.role}
            </span>
          </div>
          <button
            onClick={() => {
              const name = (document.getElementById('name') as HTMLInputElement)?.value;
              updateProfile.mutate({ name });
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
            Guardar cambios
          </button>
        </div>
      )}

      {/* Seguridad */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Cambiar contraseña */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Cambiar contraseña</h3>
            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{passwordError}</div>
            )}
            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{passwordSuccess}</div>
            )}
            <form onSubmit={handlePasswordChange} className="space-y-3">
              {(['currentPassword', 'newPassword', 'confirm'] as const).map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field === 'currentPassword' ? 'Contraseña actual' : field === 'newPassword' ? 'Nueva contraseña' : 'Confirmar nueva contraseña'}
                  </label>
                  <input type="password" value={passwordForm[field]}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, [field]: e.target.value }))}
                    minLength={field !== 'currentPassword' ? 8 : undefined}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              ))}
              <button type="submit" disabled={changePassword.isPending}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                Actualizar contraseña
              </button>
            </form>
          </div>

          {/* 2FA */}
          {profile && <TwoFactorSetup enabled={profile.twoFactorEnabled} onUpdate={() => queryClient.invalidateQueries({ queryKey: ['profile'] })} />}
        </div>
      )}

      {/* Sesiones */}
      {activeTab === 'sessions' && <SessionsList />}
    </div>
  );
}
