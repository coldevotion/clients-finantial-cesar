'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import {
  Building2, Plus, Search, Pencil, Trash2,
  CheckCircle2, XCircle, Phone, Mail, Users,
  ShieldCheck, ShieldOff, BarChart2, Layers,
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  status: 'ACTIVE' | 'SUSPENDED';
  document?: string;
  email?: string;
  phone?: string;
  notes?: string;
  contactLimit: number;
  omitActive: boolean;
  createdAt: string;
  _count?: { users: number; campaigns: number; contacts: number };
}

const PLAN_LABELS = { STARTER: 'Starter', GROWTH: 'Growth', ENTERPRISE: 'Enterprise' };
const PLAN_COLORS = {
  STARTER: 'bg-slate-100 text-slate-600',
  GROWTH: 'bg-blue-50 text-blue-600',
  ENTERPRISE: 'bg-purple-50 text-purple-600',
};

const EMPTY_FORM = {
  name: '', slug: '', plan: 'STARTER' as 'STARTER' | 'GROWTH' | 'ENTERPRISE',
  document: '', email: '', phone: '',
  contactLimit: 1000, omitActive: true, notes: '',
};

export default function AdminClientsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: tenants = [], isLoading } = useQuery<Tenant[]>({
    queryKey: ['tenants', statusFilter],
    queryFn: () => api.get<Tenant[]>('/tenants', { status: statusFilter || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) => api.post('/tenants', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenants'] }); closeForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof EMPTY_FORM> }) =>
      api.patch(`/tenants/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenants'] }); closeForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tenants/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'SUSPENDED' }) =>
      api.patch(`/tenants/${id}`, { status: status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(t: Tenant) {
    setEditing(t);
    setForm({
      name: t.name,
      slug: t.slug,
      plan: t.plan,
      document: t.document ?? '',
      email: t.email ?? '',
      phone: t.phone ?? '',
      contactLimit: t.contactLimit,
      omitActive: t.omitActive,
      notes: t.notes ?? '',
    });
    setShowForm(true);
  }

  function closeForm() { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  }

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.includes(search.toLowerCase()) ||
    (t.document ?? '').includes(search) ||
    (t.email ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Building2 size={24} className="text-primary-500" />
            Clientes
          </h1>
          <p className="text-sm text-text-muted mt-0.5">Gestión de clientes / tenants de la plataforma</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus size={15} /> Nuevo cliente
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, slug, NIT o email…"
            className="input pl-9"
          />
        </div>
        <div className="flex gap-1">
          {[['', 'Todos'], ['ACTIVE', 'Activos'], ['SUSPENDED', 'Suspendidos']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                statusFilter === val
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-text-secondary border-border hover:border-primary-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-14 rounded-lg bg-surface-muted animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-text-muted">
            <Building2 size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hay clientes</p>
            <p className="text-sm mt-1">Crea el primero para comenzar</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-muted border-b border-border">
              <tr>
                {['Cliente', 'Plan', 'Documento / Contacto', 'Usuarios / Campañas', 'Config', 'Estado', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-surface-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-text-primary">{t.name}</p>
                    <p className="text-xs text-text-muted font-mono">{t.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${PLAN_COLORS[t.plan]}`}>{PLAN_LABELS[t.plan]}</span>
                  </td>
                  <td className="px-4 py-3 space-y-0.5">
                    {t.document && <p className="text-xs font-mono text-text-secondary">{t.document}</p>}
                    {t.phone && (
                      <p className="flex items-center gap-1 text-text-secondary text-xs">
                        <Phone size={10} /> {t.phone}
                      </p>
                    )}
                    {t.email && (
                      <p className="flex items-center gap-1 text-text-secondary text-xs">
                        <Mail size={10} /> {t.email}
                      </p>
                    )}
                    {!t.document && !t.phone && !t.email && <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 text-text-secondary text-xs">
                      <span className="flex items-center gap-1"><Users size={11} /> {t._count?.users ?? 0}</span>
                      <span className="flex items-center gap-1"><BarChart2 size={11} /> {t._count?.campaigns ?? 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 space-y-1">
                    <div className="flex items-center gap-1 text-xs text-text-secondary">
                      <Layers size={10} /> {t.contactLimit.toLocaleString()} contactos
                    </div>
                    {t.omitActive ? (
                      <span className="flex items-center gap-1 text-[10px] text-amber-600"><ShieldCheck size={10} /> Omite activos</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-slate-400"><ShieldOff size={10} /> Sin omisión</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {t.status === 'ACTIVE' ? (
                      <span className="badge bg-emerald-500/10 text-emerald-600 gap-1">
                        <CheckCircle2 size={11} /> Activo
                      </span>
                    ) : (
                      <span className="badge bg-red-500/10 text-danger gap-1">
                        <XCircle size={11} /> Suspendido
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => toggleStatusMutation.mutate({ id: t.id, status: t.status })}
                        className="text-xs text-text-muted hover:text-text-primary transition-colors"
                        title={t.status === 'ACTIVE' ? 'Suspender' : 'Activar'}
                      >
                        {t.status === 'ACTIVE' ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
                      </button>
                      <button onClick={() => openEdit(t)} className="text-primary-500 hover:text-primary-600 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => window.confirm('¿Eliminar cliente? Esta acción es irreversible.') && deleteMutation.mutate(t.id)}
                        className="text-danger hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="font-bold text-text-primary text-lg">
                {editing ? 'Editar cliente' : 'Nuevo cliente'}
              </h2>
              <button onClick={closeForm} className="text-text-muted hover:text-text-primary transition-colors">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Nombre *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="Ej: Banco Nacional SA" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Slug * <span className="font-normal text-text-muted">(URL)</span></label>
                  <input
                    required
                    disabled={!!editing}
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                    className="input disabled:opacity-50 disabled:bg-surface-muted"
                    placeholder="banco-nacional"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Plan</label>
                  <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value as any }))} className="input">
                    <option value="STARTER">Starter</option>
                    <option value="GROWTH">Growth</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">NIT / Documento</label>
                  <input value={form.document} onChange={e => setForm(f => ({ ...f, document: e.target.value }))} className="input" placeholder="900.123.456-1" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Teléfono</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" placeholder="+57160012345" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Email de contacto</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" placeholder="ops@empresa.com" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Límite contactos / campaña</label>
                  <input type="number" min={1} value={form.contactLimit} onChange={e => setForm(f => ({ ...f, contactLimit: Number(e.target.value) }))} className="input" />
                </div>

                <div className="flex items-center gap-3 pt-5">
                  <input
                    type="checkbox"
                    id="omitActive"
                    checked={form.omitActive}
                    onChange={e => setForm(f => ({ ...f, omitActive: e.target.checked }))}
                    className="w-4 h-4 accent-primary-500"
                  />
                  <label htmlFor="omitActive" className="text-sm text-text-secondary leading-snug">
                    Omitir contactos con ventana WA activa (24h)
                  </label>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Notas internas</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input resize-none" placeholder="Notas internas…" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={isSaving} className="btn-primary">
                  {isSaving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
