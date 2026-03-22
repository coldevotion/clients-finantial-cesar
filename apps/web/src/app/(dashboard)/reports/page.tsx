'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import {
  PieChart, BarChart2, CheckCircle2, XCircle,
  Clock, MessageSquare, FileText, Eye,
  TrendingUp, TrendingDown, ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HsmDispatch {
  id: string;
  status: string;
  sentAt: string;
  contact: { name: string; phone: string };
  campaign: { name: string; template: { name: string; category: string } };
}

interface TemplateSummary {
  templateId: string;
  templateName: string;
  category: string;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  campaigns: number;
}

interface ByStatus { status: string; count: number; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { color: string; icon: React.FC<any>; label: string }> = {
  READ:      { color: 'bg-emerald-500/10 text-emerald-600', icon: CheckCircle2, label: 'Leído' },
  DELIVERED: { color: 'bg-blue-500/10 text-blue-600',       icon: CheckCircle2, label: 'Entregado' },
  SENT:      { color: 'bg-slate-100 text-slate-500',         icon: Clock,        label: 'Enviado' },
  FAILED:    { color: 'bg-red-500/10 text-danger',           icon: XCircle,      label: 'Fallido' },
};

function pct(num: number, den: number) {
  if (!den) return '—';
  return `${((num / den) * 100).toFixed(1)}%`;
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const w = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-muted w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-surface-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${w}%` }} />
      </div>
      <span className="text-xs font-semibold text-text-secondary w-14 text-right">{value.toLocaleString()}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'summary' | 'hsm' | 'conversations';

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('summary');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [templateFilter, setTemplateFilter] = useState('');
  const [expandedConv, setExpandedConv] = useState<string | null>(null);

  // Queries
  const summaryQ = useQuery<{ byStatus: ByStatus[]; byTemplate: TemplateSummary[] }>({
    queryKey: ['reports/summary', fromDate, toDate],
    queryFn: () => api.get<{ byStatus: ByStatus[]; byTemplate: TemplateSummary[] }>('/analytics/reports/summary', { from: fromDate || undefined, to: toDate || undefined }),
  });

  const hsmQ = useQuery<{ data: HsmDispatch[]; total: number; pages: number }>({
    queryKey: ['reports/hsm', fromDate, toDate, phoneFilter, templateFilter],
    queryFn: () => api.get<{ data: HsmDispatch[]; total: number; pages: number }>('/analytics/reports/hsm', {
      from: fromDate || undefined,
      to: toDate || undefined,
      phone: phoneFilter || undefined,
      templateId: templateFilter || undefined,
    }),
    enabled: tab === 'hsm',
  });

  const convQ = useQuery<{ data: any[]; total: number }>({
    queryKey: ['reports/conversations', fromDate, toDate, phoneFilter],
    queryFn: () => api.get<{ data: any[]; total: number }>('/analytics/reports/conversations', {
      from: fromDate || undefined,
      to: toDate || undefined,
      phone: phoneFilter || undefined,
    }),
    enabled: tab === 'conversations',
  });

  const summary = summaryQ.data;
  const maxStatus = Math.max(...(summary?.byStatus.map(s => s.count) ?? [1]));

  const statusColors: Record<string, string> = {
    READ: 'bg-emerald-500', DELIVERED: 'bg-blue-500', SENT: 'bg-slate-400', FAILED: 'bg-red-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <PieChart size={24} className="text-primary-500" />
          Reportes
        </h1>
        <p className="text-sm text-text-muted mt-0.5">Análisis de envíos HSM, conversaciones y efectividad</p>
      </div>

      {/* Date filters */}
      <div className="card px-5 py-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-text-secondary">Desde</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="input w-auto text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-text-secondary">Hasta</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="input w-auto text-sm" />
        </div>
        {(fromDate || toDate) && (
          <button onClick={() => { setFromDate(''); setToDate(''); }} className="btn-ghost text-xs py-1.5 px-3">
            Limpiar fechas
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-muted rounded-xl p-1 w-fit">
        {([
          { id: 'summary', label: 'Resumen', icon: BarChart2 },
          { id: 'hsm', label: 'Envíos HSM', icon: FileText },
          { id: 'conversations', label: 'Conversaciones', icon: MessageSquare },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === id ? 'bg-white text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
          >
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* ── Summary Tab ──────────────────────────────────────────────────────── */}
      {tab === 'summary' && (
        <div className="space-y-6">
          {/* Status distribution */}
          <div className="card px-5 py-5">
            <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-primary-500" />
              Distribución por estado
            </h2>
            {summaryQ.isLoading ? (
              <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-5 bg-surface-muted rounded animate-pulse" />)}</div>
            ) : (
              <div className="space-y-3">
                {summary?.byStatus.map(s => (
                  <StatBar key={s.status} label={STATUS_STYLE[s.status]?.label ?? s.status} value={s.count} max={maxStatus} color={statusColors[s.status] ?? 'bg-slate-400'} />
                ))}
                <div className="pt-2 border-t border-border flex items-center justify-between text-sm">
                  <span className="text-text-muted">Total mensajes</span>
                  <span className="font-bold text-text-primary">
                    {(summary?.byStatus.reduce((a, b) => a + b.count, 0) ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* By template */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-text-primary flex items-center gap-2">
                <FileText size={16} className="text-primary-500" />
                Por plantilla HSM
              </h2>
            </div>
            {summaryQ.isLoading ? (
              <div className="p-5 space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-surface-muted rounded animate-pulse" />)}</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-surface-muted">
                  <tr>
                    {['Plantilla', 'Categoría', 'Campañas', 'Enviados', 'Entregados', 'Leídos', '% Lectura', 'Fallidos'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {summary?.byTemplate.map(t => (
                    <tr key={t.templateId} className="hover:bg-surface-muted/40">
                      <td className="px-4 py-3 font-medium text-text-primary">{t.templateName}</td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${t.category === 'MARKETING' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {t.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{t.campaigns}</td>
                      <td className="px-4 py-3 text-text-secondary">{t.sent.toLocaleString()}</td>
                      <td className="px-4 py-3 text-text-secondary">{t.delivered.toLocaleString()}</td>
                      <td className="px-4 py-3 text-text-secondary">{t.read.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-emerald-600">{pct(t.read, t.sent)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={t.failed > 0 ? 'text-danger font-medium' : 'text-text-muted'}>
                          {t.failed.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── HSM Tab ──────────────────────────────────────────────────────────── */}
      {tab === 'hsm' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <input
              value={phoneFilter}
              onChange={e => setPhoneFilter(e.target.value)}
              placeholder="Filtrar por teléfono…"
              className="input w-52"
            />
            <input
              value={templateFilter}
              onChange={e => setTemplateFilter(e.target.value)}
              placeholder="ID de plantilla…"
              className="input w-52"
            />
          </div>

          <div className="card overflow-hidden">
            {hsmQ.isLoading ? (
              <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-surface-muted rounded animate-pulse" />)}</div>
            ) : (
              <>
                <div className="px-5 py-3 border-b border-border flex items-center justify-between text-sm">
                  <span className="text-text-muted">
                    {hsmQ.data?.total.toLocaleString()} envíos totales
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-surface-muted">
                    <tr>
                      {['Contacto', 'Teléfono', 'Plantilla', 'Campaña', 'Estado', 'Enviado en'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {hsmQ.data?.data.map(d => {
                      const st = STATUS_STYLE[d.status] ?? STATUS_STYLE['SENT'];
                      const Icon = st.icon;
                      return (
                        <tr key={d.id} className="hover:bg-surface-muted/40">
                          <td className="px-4 py-3 font-medium text-text-primary">{d.contact.name}</td>
                          <td className="px-4 py-3 text-text-secondary font-mono text-xs">{d.contact.phone}</td>
                          <td className="px-4 py-3 text-text-secondary">{d.campaign.template.name}</td>
                          <td className="px-4 py-3 text-text-secondary">{d.campaign.name}</td>
                          <td className="px-4 py-3">
                            <span className={`badge ${st.color} gap-1`}>
                              <Icon size={10} />{st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-text-muted text-xs">
                            {d.sentAt ? new Date(d.sentAt).toLocaleString('es-CO') : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Conversations Tab ────────────────────────────────────────────────── */}
      {tab === 'conversations' && (
        <div className="space-y-4">
          {/* Filter */}
          <input
            value={phoneFilter}
            onChange={e => setPhoneFilter(e.target.value)}
            placeholder="Filtrar por teléfono…"
            className="input w-52"
          />

          {convQ.isLoading ? (
            <div className="card p-6 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-surface-muted rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="card divide-y divide-border overflow-hidden">
              {(convQ.data?.data ?? []).length === 0 ? (
                <div className="py-14 text-center text-text-muted">
                  <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                  <p>Sin conversaciones</p>
                </div>
              ) : convQ.data?.data.map(cv => (
                <div key={cv.id}>
                  <button
                    onClick={() => setExpandedConv(expandedConv === cv.id ? null : cv.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-surface-muted/40 text-left transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {cv.contact.name?.[0] ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-text-primary">{cv.contact.name}</p>
                        <span className={`badge ${cv.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          {cv.status === 'OPEN' ? 'Abierta' : 'Cerrada'}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted">{cv.contact.phone} · {cv.messages.length} mensajes · {new Date(cv.startedAt).toLocaleString('es-CO')}</p>
                    </div>
                    {expandedConv === cv.id ? <ChevronUp size={16} className="text-text-muted flex-shrink-0" /> : <ChevronDown size={16} className="text-text-muted flex-shrink-0" />}
                  </button>

                  {expandedConv === cv.id && (
                    <div className="px-5 pb-5 space-y-2 bg-surface-muted/20">
                      {cv.messages.map((m: any, i: number) => (
                        <div
                          key={i}
                          className={`flex ${m.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm shadow-sm
                            ${m.direction === 'OUTBOUND'
                              ? 'bg-primary-500 text-white rounded-br-sm'
                              : 'bg-white text-text-primary rounded-bl-sm border border-border'
                            }`}
                          >
                            <p>{m.content?.text ?? JSON.stringify(m.content)}</p>
                            <p className={`text-[10px] mt-1 text-right ${m.direction === 'OUTBOUND' ? 'text-white/60' : 'text-text-muted'}`}>
                              {m.direction === 'OUTBOUND' ? 'Enviado' : 'Recibido'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
