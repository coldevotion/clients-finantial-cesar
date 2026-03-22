'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import {
  Plus, FileText, CheckCircle2, Clock, XCircle,
  Image, Video, Type, Trash2, Pencil, Eye,
  ChevronDown, ChevronUp, Link as LinkIcon, Phone,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Template {
  id: string;
  name: string;
  category: string;
  language: string;
  status: string;
  headerType?: string;
  headerText?: string;
  imageUrl?: string;
  videoUrl?: string;
  documentUrl?: string;
  footerText?: string;
  bodyText?: string;
  buttons?: Button[];
}

interface Button {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
  url?: string;
  phoneNumber?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  APPROVED: { label: 'Aprobada',  color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', icon: CheckCircle2 },
  PENDING:  { label: 'Pendiente', color: 'bg-amber-500/10  text-amber-600  border-amber-200',    icon: Clock },
  REJECTED: { label: 'Rechazada', color: 'bg-red-500/10    text-danger     border-red-200',      icon: XCircle },
};

const CATEGORY_COLOR: Record<string, string> = {
  UTILITY:        'bg-primary-50 text-primary-600 border-primary-200',
  MARKETING:      'bg-purple-50 text-purple-600 border-purple-200',
  AUTHENTICATION: 'bg-amber-50 text-amber-600 border-amber-200',
};

const HEADER_ICONS: Record<string, React.ElementType> = {
  TEXT:     Type,
  IMAGE:    Image,
  VIDEO:    Video,
  DOCUMENT: FileText,
};

const EMPTY_BTN: Button = { type: 'QUICK_REPLY', text: '' };

const EMPTY_FORM: Omit<Template, 'id' | 'status'> = {
  name: '', category: 'UTILITY', language: 'es',
  headerType: '', headerText: '', imageUrl: '', videoUrl: '', documentUrl: '',
  footerText: '', bodyText: '', buttons: [],
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM, buttons: [] });
  const [preview, setPreview] = useState<Template | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: () => api.get<Template[]>('/templates'),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) => api.post('/templates', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); closeForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof EMPTY_FORM }) =>
      api.put(`/templates/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); closeForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });

  function openNew() { setEditing(null); setForm({ ...EMPTY_FORM, buttons: [] }); setShowForm(true); }
  function openEdit(t: Template) {
    setEditing(t);
    setForm({ name: t.name, category: t.category, language: t.language, headerType: t.headerType ?? '', headerText: t.headerText ?? '', imageUrl: t.imageUrl ?? '', videoUrl: t.videoUrl ?? '', documentUrl: t.documentUrl ?? '', footerText: t.footerText ?? '', bodyText: t.bodyText ?? '', buttons: t.buttons ?? [] });
    setShowForm(true);
  }
  function closeForm() { setShowForm(false); setEditing(null); setForm({ ...EMPTY_FORM, buttons: [] }); }

  function addButton() { setForm(f => ({ ...f, buttons: [...(f.buttons ?? []), { ...EMPTY_BTN }] })); }
  function removeButton(i: number) { setForm(f => ({ ...f, buttons: (f.buttons ?? []).filter((_, j) => j !== i) })); }
  function updateButton(i: number, patch: Partial<Button>) {
    setForm(f => ({ ...f, buttons: (f.buttons ?? []).map((b, j) => j === i ? { ...b, ...patch } : b) }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  }

  const filtered = templates.filter(t => !categoryFilter || t.category === categoryFilter);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FileText size={24} className="text-primary-500" />
            Plantillas HSM
          </h1>
          <p className="text-sm text-text-muted mt-0.5">Gestiona tus plantillas de WhatsApp aprobadas por Meta</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus size={15} /> Nueva plantilla
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'UTILITY', 'MARKETING', 'AUTHENTICATION'].map(c => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              categoryFilter === c
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white text-text-secondary border-border hover:border-primary-300'
            }`}
          >
            {c || 'Todas'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card p-5 animate-pulse space-y-3">
              <div className="flex justify-between">
                <div className="w-36 h-4 bg-surface-muted rounded" />
                <div className="w-16 h-5 bg-surface-muted rounded-full" />
              </div>
              <div className="h-3 bg-surface-muted rounded w-full" />
              <div className="h-3 bg-surface-muted rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-20 text-center">
          <FileText size={36} className="text-text-muted mx-auto mb-3" />
          <p className="font-semibold text-text-secondary">Sin plantillas aún</p>
          <button onClick={openNew} className="btn-primary mt-4 mx-auto"><Plus size={15} /> Nueva plantilla</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(t => {
            const st  = STATUS_MAP[t.status]  ?? STATUS_MAP.PENDING;
            const cat = CATEGORY_COLOR[t.category] ?? 'bg-surface-muted text-text-secondary border-border';
            const StatusIcon = st.icon;
            const HeaderIcon = t.headerType ? (HEADER_ICONS[t.headerType] ?? FileText) : null;

            return (
              <div key={t.id} className="card p-5 hover:shadow-card-hover transition-shadow duration-200 group flex flex-col gap-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-primary-500" />
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${st.color}`}>
                    <StatusIcon size={10} />{st.label}
                  </span>
                </div>

                {/* Name */}
                <p className="font-semibold text-text-primary text-sm group-hover:text-primary-600 transition-colors">{t.name}</p>

                {/* Header type indicator */}
                {t.headerType && HeaderIcon && (
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <HeaderIcon size={12} />
                    <span>Header {t.headerType.toLowerCase()}</span>
                    {t.headerText && <span className="truncate">— {t.headerText}</span>}
                  </div>
                )}

                {/* Body preview */}
                {t.bodyText && (
                  <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">{t.bodyText}</p>
                )}

                {/* Buttons preview */}
                {t.buttons && t.buttons.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {t.buttons.slice(0, 3).map((b, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded border border-primary-200 text-primary-600 bg-primary-50">
                        {b.text}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                {t.footerText && (
                  <p className="text-[10px] text-text-muted italic">{t.footerText}</p>
                )}

                {/* Badges */}
                <div className="flex gap-2 flex-wrap mt-auto">
                  <span className={`badge border ${cat}`}>{t.category}</span>
                  <span className="badge bg-surface-muted text-text-muted border border-border">{t.language.toUpperCase()}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <button onClick={() => setPreview(t)} className="btn-ghost text-xs py-1 px-2 gap-1">
                    <Eye size={12} /> Vista previa
                  </button>
                  <button onClick={() => openEdit(t)} className="btn-ghost text-xs py-1 px-2 gap-1">
                    <Pencil size={12} /> Editar
                  </button>
                  <button
                    onClick={() => confirm('¿Eliminar plantilla?') && deleteMutation.mutate(t.id)}
                    className="btn-ghost text-xs py-1 px-2 gap-1 text-danger hover:text-danger ml-auto"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create/Edit Modal ────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mb-10">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="font-bold text-text-primary text-lg">
                {editing ? 'Editar plantilla' : 'Nueva plantilla HSM'}
              </h2>
              <button onClick={closeForm} className="text-text-muted hover:text-text-primary transition-colors">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Nombre de la plantilla *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))} className="input" placeholder="cobros_atrasados" />
                  <p className="text-[10px] text-text-muted mt-1">Solo minúsculas, guiones bajos, sin espacios</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Categoría</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input">
                    <option value="UTILITY">Utilidad</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="AUTHENTICATION">Autenticación</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Idioma</label>
                  <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} className="input">
                    <option value="es">Español (es)</option>
                    <option value="en">Inglés (en)</option>
                    <option value="pt_BR">Portugués (pt_BR)</option>
                  </select>
                </div>
              </div>

              {/* Header */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-text-secondary">Tipo de encabezado</label>
                <div className="flex gap-2 flex-wrap">
                  {['', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'].map(ht => (
                    <button
                      key={ht}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, headerType: ht }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        form.headerType === ht ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-text-secondary border-border hover:border-primary-300'
                      }`}
                    >
                      {ht || 'Ninguno'}
                    </button>
                  ))}
                </div>

                {form.headerType === 'TEXT' && (
                  <input value={form.headerText} onChange={e => setForm(f => ({ ...f, headerText: e.target.value }))} className="input" placeholder="Texto del encabezado" maxLength={60} />
                )}
                {form.headerType === 'IMAGE' && (
                  <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} className="input" placeholder="URL de la imagen (https://...)" />
                )}
                {form.headerType === 'VIDEO' && (
                  <input value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} className="input" placeholder="URL del video (https://...)" />
                )}
                {form.headerType === 'DOCUMENT' && (
                  <input value={form.documentUrl} onChange={e => setForm(f => ({ ...f, documentUrl: e.target.value }))} className="input" placeholder="URL del documento (https://...)" />
                )}
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Cuerpo del mensaje *</label>
                <textarea
                  required
                  rows={4}
                  value={form.bodyText}
                  onChange={e => setForm(f => ({ ...f, bodyText: e.target.value }))}
                  className="input resize-none"
                  placeholder="Hola {{1}}, tu deuda de ${{2}} vence el {{3}}. Por favor contáctanos."
                />
                <p className="text-[10px] text-text-muted mt-1">Usa {"{{1}}"}, {"{{2}}"} para variables dinámicas</p>
              </div>

              {/* Footer */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Pie de página (opcional)</label>
                <input value={form.footerText} onChange={e => setForm(f => ({ ...f, footerText: e.target.value }))} className="input" placeholder="Provired Cobranzas" maxLength={60} />
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-secondary">Botones (máximo 3)</label>
                  {(form.buttons?.length ?? 0) < 3 && (
                    <button type="button" onClick={addButton} className="btn-ghost text-xs py-1 px-2 gap-1">
                      <Plus size={11} /> Agregar botón
                    </button>
                  )}
                </div>
                {form.buttons?.map((btn, i) => (
                  <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex gap-2 items-start">
                      <select value={btn.type} onChange={e => updateButton(i, { type: e.target.value as Button['type'] })} className="input w-36 text-xs">
                        <option value="QUICK_REPLY">Respuesta rápida</option>
                        <option value="URL">URL</option>
                        <option value="PHONE_NUMBER">Teléfono</option>
                      </select>
                      <input
                        value={btn.text}
                        onChange={e => updateButton(i, { text: e.target.value })}
                        className="input flex-1 text-xs"
                        placeholder="Texto del botón"
                        maxLength={25}
                      />
                      <button type="button" onClick={() => removeButton(i)} className="text-danger hover:text-red-700 p-1 flex-shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {btn.type === 'URL' && (
                      <input value={btn.url ?? ''} onChange={e => updateButton(i, { url: e.target.value })} className="input text-xs" placeholder="https://empresa.com/pago" />
                    )}
                    {btn.type === 'PHONE_NUMBER' && (
                      <input value={btn.phoneNumber ?? ''} onChange={e => updateButton(i, { phoneNumber: e.target.value })} className="input text-xs" placeholder="+573001234567" />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <button type="button" onClick={closeForm} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={isSaving} className="btn-primary">
                  {isSaving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear plantilla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Preview Modal ────────────────────────────────────────────────────── */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-text-primary">Vista previa — {preview.name}</h2>
              <button onClick={() => setPreview(null)} className="text-text-muted hover:text-text-primary">✕</button>
            </div>
            <div className="p-5">
              {/* WhatsApp-like message bubble */}
              <div className="bg-[#ECE5DD] rounded-xl p-4 space-y-2">
                <div className="bg-white rounded-xl rounded-tl-sm shadow-sm overflow-hidden max-w-[85%]">
                  {/* Header */}
                  {preview.headerType === 'IMAGE' && preview.imageUrl && (
                    <img src={preview.imageUrl} alt="header" className="w-full h-32 object-cover" onError={e => (e.currentTarget.style.display='none')} />
                  )}
                  {preview.headerType === 'TEXT' && preview.headerText && (
                    <div className="px-3 pt-3 font-bold text-sm text-text-primary">{preview.headerText}</div>
                  )}
                  {preview.headerType === 'VIDEO' && (
                    <div className="px-3 pt-3 flex items-center gap-2 text-xs text-blue-600"><Video size={14} /> Video adjunto</div>
                  )}
                  {preview.headerType === 'DOCUMENT' && (
                    <div className="px-3 pt-3 flex items-center gap-2 text-xs text-blue-600"><FileText size={14} /> Documento adjunto</div>
                  )}

                  <div className="px-3 py-3">
                    <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{preview.bodyText ?? '(sin cuerpo)'}</p>
                    {preview.footerText && (
                      <p className="text-xs text-text-muted mt-2 italic">{preview.footerText}</p>
                    )}
                    <p className="text-[10px] text-text-muted text-right mt-1">12:00 ✓✓</p>
                  </div>

                  {/* Buttons */}
                  {preview.buttons && preview.buttons.length > 0 && (
                    <div className="border-t border-gray-100">
                      {preview.buttons.map((b, i) => (
                        <button key={i} className={`w-full py-2.5 text-sm text-blue-600 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                          {b.type === 'URL' && <LinkIcon size={12} />}
                          {b.type === 'PHONE_NUMBER' && <Phone size={12} />}
                          {b.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
