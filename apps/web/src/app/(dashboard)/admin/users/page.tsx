'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useIsSuperAdmin } from '@/store/auth.store';
import {
  UsersRound, Plus, Search, Pencil, Trash2,
  CheckCircle2, XCircle, ShieldCheck, Shield,
  Eye, EyeOff, Key, Building2,
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface User {
  id: string;
  name?: string;
  email: string;
  role: string;
  tenantId?: string;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
  tenant?: { id: string; name: string; slug: string };
}

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN:     { label: 'Super Admin',  color: 'bg-red-500/10 text-red-600 border-red-200' },
  TENANT_ADMIN:    { label: 'Admin',        color: 'bg-primary-500/10 text-primary-600 border-primary-200' },
  TENANT_OPERATOR: { label: 'Operador',     color: 'bg-slate-100 text-slate-600 border-slate-200' },
  TENANT_VIEWER:   { label: 'Visualizador', color: 'bg-slate-50 text-slate-400 border-slate-100' },
};

const EMPTY_FORM = {
  name: '', email: '', password: '',
  role: 'TENANT_OPERATOR',
  tenantId: '',
};

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const isSuperAdmin = useIsSuperAdmin();
  const [search, setSearch] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['admin-users', tenantFilter],
    queryFn: () => api.get<User[]>('/users', { tenantId: tenantFilter || undefined }),
  });

  // Load tenants for the selector (SUPER_ADMIN only)
  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ['tenants-selector'],
    queryFn: () => api.get<Tenant[]>('/tenants'),
    enabled: isSuperAdmin,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) => api.post('/users', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); closeForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof EMPTY_FORM> }) =>
      api.patch(`/users/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); closeForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  function openNew() { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }

  function openEdit(u: User) {
    setEditing(u);
    setForm({
      name: u.name ?? '',
      email: u.email,
      password: '',
      role: u.role,
      tenantId: u.tenant?.id ?? u.tenantId ?? '',
    });
    setShowForm(true);
  }

  function closeForm() { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      const data: Record<string, any> = { name: form.name, role: form.role };
      if (form.password) data.password = form.password;
      if (isSuperAdmin) data.tenantId = form.tenantId || null;
      updateMutation.mutate({ id: editing.id, data: data as any });
    } else {
      createMutation.mutate(form);
    }
  }

  const filtered = users.filter(u =>
    (u.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.tenant?.name ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <UsersRound size={24} className="text-primary-500" />
            Usuarios del sistema
          </h1>
          <p className="text-sm text-text-muted mt-0.5">Gestión de usuarios y roles de acceso</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus size={15} /> Nuevo usuario
        </button>
      </div>

      {/* Role stats bar */}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
          <div key={role} className="card px-4 py-3 flex items-center gap-3">
            <ShieldCheck size={18} className="text-text-muted flex-shrink-0" />
            <div>
              <p className="text-[11px] text-text-muted">{cfg.label}</p>
              <p className="font-bold text-text-primary text-lg leading-none">
                {users.filter(u => u.role === role).length}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, email o cliente…" className="input pl-9" />
        </div>
        {isSuperAdmin && tenants.length > 0 && (
          <select
            value={tenantFilter}
            onChange={e => setTenantFilter(e.target.value)}
            className="input max-w-xs"
          >
            <option value="">Todos los clientes</option>
            {tenants.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-14 rounded-lg bg-surface-muted animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-text-muted">
            <UsersRound size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin usuarios</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-muted border-b border-border">
              <tr>
                {['Usuario', 'Email', 'Rol', 'Cliente', '2FA', 'Último acceso', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(u => {
                const rc = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.TENANT_OPERATOR;
                return (
                  <tr key={u.id} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(u.name ?? u.email)[0].toUpperCase()}
                        </div>
                        <p className="font-medium text-text-primary">{u.name ?? '—'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        {u.email}
                        {u.isEmailVerified
                          ? <CheckCircle2 size={12} className="text-emerald-500" />
                          : <XCircle size={12} className="text-slate-300" />
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge border text-[11px] gap-1 ${rc.color}`}>
                        <Shield size={9} />{rc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.tenant ? (
                        <div className="flex items-center gap-1 text-text-secondary text-xs">
                          <Building2 size={11} />
                          <span>{u.tenant.name}</span>
                        </div>
                      ) : (
                        <span className="text-text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.twoFactorEnabled
                        ? <span className="badge bg-emerald-500/10 text-emerald-600 gap-1"><Key size={10} /> Activo</span>
                        : <span className="badge bg-slate-100 text-slate-400">Inactivo</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('es-CO') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEdit(u)} className="text-primary-500 hover:text-primary-600"><Pencil size={15} /></button>
                        {isSuperAdmin && (
                          <button onClick={() => window.confirm('¿Eliminar usuario?') && deleteMutation.mutate(u.id)} className="text-danger hover:text-red-700">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-text-primary text-lg">{editing ? 'Editar usuario' : 'Nuevo usuario'}</h2>
              <button onClick={closeForm} className="text-text-muted hover:text-text-primary">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Nombre</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="Juan García" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Email *</label>
                <input
                  required
                  type="email"
                  disabled={!!editing}
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input disabled:opacity-50 disabled:bg-surface-muted"
                  placeholder="juan@empresa.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {editing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
                </label>
                <div className="relative">
                  <input
                    required={!editing}
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="input pr-10"
                    placeholder="Mínimo 8 caracteres"
                    minLength={editing ? 0 : 8}
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Rol</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input">
                  <option value="TENANT_VIEWER">Visualizador</option>
                  <option value="TENANT_OPERATOR">Operador</option>
                  <option value="TENANT_ADMIN">Admin</option>
                  {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
                </select>
              </div>

              {/* Tenant selector — SUPER_ADMIN only */}
              {isSuperAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Cliente <span className="font-normal text-text-muted">(opcional para SUPER_ADMIN)</span>
                  </label>
                  <select value={form.tenantId} onChange={e => setForm(f => ({ ...f, tenantId: e.target.value }))} className="input">
                    <option value="">Sin cliente asignado</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.slug})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={isSaving} className="btn-primary">
                  {isSaving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
