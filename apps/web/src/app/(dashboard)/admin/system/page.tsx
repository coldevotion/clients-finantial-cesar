'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import {
  Activity, AlertCircle, AlertTriangle, Info,
  CheckCircle2, TrendingUp, Users, MessageSquare,
  Building2, BarChart2, RefreshCw,
} from 'lucide-react';

interface AdminStats {
  activeClients: number;
  activeUsers: number;
  totalMessagesSent: number;
  totalMessagesFailed: number;
  activeCampaigns: number;
}

interface Log {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  action: string;
  resource?: string;
  resourceId?: string;
  userId?: string;
  tenantId?: string;
  createdAt: string;
}

interface LogStats {
  total: number;
  errors: number;
  warnings: number;
  info: number;
}

const LEVEL_CONFIG = {
  INFO:  { color: 'bg-blue-500/10 text-blue-600 border-blue-200',  icon: Info,          dot: 'bg-blue-500' },
  WARN:  { color: 'bg-amber-500/10 text-amber-600 border-amber-200', icon: AlertTriangle, dot: 'bg-amber-500' },
  ERROR: { color: 'bg-red-500/10 text-danger border-red-200',       icon: AlertCircle,   dot: 'bg-red-500' },
};

export default function SystemPage() {
  const [levelFilter, setLevelFilter] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const statsQ = useQuery<AdminStats>({
    queryKey: ['admin/stats'],
    queryFn: () => api.get<AdminStats>('/analytics/admin/stats'),
    refetchInterval: autoRefresh ? 30_000 : false,
  });

  const logStatsQ = useQuery<LogStats>({
    queryKey: ['logs/stats'],
    queryFn: () => api.get<LogStats>('/logs/stats'),
    refetchInterval: autoRefresh ? 30_000 : false,
  });

  const logsQ = useQuery<Log[]>({
    queryKey: ['logs', levelFilter],
    queryFn: () => api.get<Log[]>('/logs', { level: levelFilter || undefined, limit: '100' }),
    refetchInterval: autoRefresh ? 15_000 : false,
  });

  const stats = statsQ.data;
  const logStats = logStatsQ.data;
  const logs = logsQ.data ?? [];

  const failRate = stats
    ? ((stats.totalMessagesFailed / Math.max(stats.totalMessagesSent, 1)) * 100).toFixed(1)
    : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Activity size={24} className="text-primary-500" />
            Sistema y Logs
          </h1>
          <p className="text-sm text-text-muted mt-0.5">Métricas globales y registro de eventos del sistema</p>
        </div>
        <button
          onClick={() => setAutoRefresh(r => !r)}
          className={`btn-ghost text-xs py-1.5 px-3 gap-1.5 ${autoRefresh ? 'text-emerald-600' : 'text-text-muted'}`}
        >
          <RefreshCw size={13} className={autoRefresh ? 'animate-spin' : ''} />
          {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
        </button>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Clientes activos',   value: stats?.activeClients,       icon: Building2,    color: 'text-primary-500' },
          { label: 'Usuarios activos',   value: stats?.activeUsers,         icon: Users,        color: 'text-purple-500' },
          { label: 'Mensajes enviados',  value: stats?.totalMessagesSent,   icon: MessageSquare, color: 'text-emerald-500' },
          { label: 'Campañas activas',   value: stats?.activeCampaigns,     icon: BarChart2,    color: 'text-blue-500' },
          { label: 'Tasa de fallos',     value: `${failRate}%`,             icon: AlertCircle,  color: Number(failRate) > 5 ? 'text-danger' : 'text-emerald-500' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card px-4 py-4">
              <div className={`mb-2 ${s.color}`}><Icon size={18} /></div>
              <p className="text-xs text-text-muted">{s.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${s.color}`}>
                {statsQ.isLoading ? '—' : (typeof s.value === 'number' ? s.value.toLocaleString() : s.value)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Log stats */}
      {logStats && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total logs',    value: logStats.total,    color: 'text-text-primary',  bg: 'bg-slate-100' },
            { label: 'Informativos', value: logStats.info,     color: 'text-blue-600',       bg: 'bg-blue-50' },
            { label: 'Advertencias', value: logStats.warnings, color: 'text-amber-600',      bg: 'bg-amber-50' },
            { label: 'Errores',      value: logStats.errors,   color: 'text-danger',         bg: 'bg-red-50' },
          ].map(s => (
            <div key={s.label} className={`card px-4 py-3 ${s.bg} border-0`}>
              <p className="text-xs text-text-muted">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Log table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-text-primary">Registro de eventos</h2>
          <div className="flex gap-2">
            {['', 'INFO', 'WARN', 'ERROR'].map(l => (
              <button
                key={l}
                onClick={() => setLevelFilter(l)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  levelFilter === l
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-text-secondary border-border hover:border-primary-300'
                }`}
              >
                {l || 'Todos'}
              </button>
            ))}
          </div>
        </div>

        {logsQ.isLoading ? (
          <div className="p-5 space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-10 rounded bg-surface-muted animate-pulse" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-text-muted">
            <Activity size={28} className="mx-auto mb-2 opacity-30" />
            <p>Sin eventos registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map(log => {
              const cfg = LEVEL_CONFIG[log.level] ?? LEVEL_CONFIG.INFO;
              const Icon = cfg.icon;
              return (
                <div key={log.id} className="px-5 py-3 flex items-start gap-3 hover:bg-surface-muted/30 transition-colors">
                  <span className={`mt-0.5 flex-shrink-0 badge border ${cfg.color} gap-1 text-[10px]`}>
                    <Icon size={10} />{log.level}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary text-sm">{log.action}</p>
                    {(log.resource || log.resourceId) && (
                      <p className="text-xs text-text-muted">
                        {log.resource}{log.resourceId ? ` · ${log.resourceId}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-text-muted whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('es-CO')}
                    </p>
                    {log.tenantId && (
                      <p className="text-[10px] text-text-muted/60 font-mono">{log.tenantId.slice(0,8)}…</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
