'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Plus, Send, CheckCircle2, Clock, Ban, Pause } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT:     { label: 'Borrador',   color: 'bg-surface-muted text-text-secondary border-border',     icon: Clock },
  RUNNING:   { label: 'En curso',   color: 'bg-primary-50 text-primary-600 border-primary-200',      icon: Send },
  COMPLETED: { label: 'Completada', color: 'bg-success/10 text-success border-success/20',            icon: CheckCircle2 },
  PAUSED:    { label: 'Pausada',    color: 'bg-warning/10 text-warning border-warning/20',            icon: Pause },
  CANCELLED: { label: 'Cancelada',  color: 'bg-danger/10 text-danger border-danger/20',               icon: Ban },
};

function RowSkeleton() {
  return (
    <div className="flex items-center justify-between px-5 py-4 animate-pulse">
      <div className="space-y-2">
        <div className="w-40 h-4 bg-surface-muted rounded" />
        <div className="w-28 h-3 bg-surface-muted rounded" />
      </div>
      <div className="flex items-center gap-4">
        <div className="w-20 h-8 bg-surface-muted rounded-lg" />
        <div className="w-20 h-6 bg-surface-muted rounded-full" />
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.get<any[]>('/campaigns'),
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Campañas</h1>
          <p className="text-text-secondary text-sm mt-1">{campaigns?.length ?? 0} campañas en total</p>
        </div>
        <Link href="/campaigns/new" className="btn-primary">
          <Plus size={16} /> Nueva campaña
        </Link>
      </div>

      <div className="card overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 border-b border-border bg-surface-muted">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Campaña</span>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Estadísticas</span>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Estado</span>
        </div>

        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)
          : campaigns?.length === 0
            ? (
              <div className="py-16 text-center">
                <Send size={32} className="text-text-muted mx-auto mb-3" />
                <p className="font-medium text-text-secondary">Sin campañas aún</p>
                <p className="text-sm text-text-muted mt-1">Crea tu primera campaña para empezar</p>
              </div>
            )
            : campaigns?.map((c: any) => {
              const st = STATUS_MAP[c.status] ?? STATUS_MAP.DRAFT;
              const Icon = st.icon;
              return (
                <div
                  key={c.id}
                  className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-4 border-b border-border/50 last:border-0 hover:bg-surface-muted/50 transition-colors duration-100"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-text-primary text-sm truncate">{c.name}</p>
                    <p className="text-xs text-text-muted mt-0.5 truncate">{c.template?.name}</p>
                  </div>
                  <div className="text-right text-xs text-text-secondary space-y-0.5 tabular-nums">
                    <p className="text-text-primary font-medium">{(c.sent ?? 0).toLocaleString()} enviados</p>
                    <p>{(c.delivered ?? 0).toLocaleString()} entregados</p>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${st.color}`}>
                    <Icon size={11} />
                    {st.label}
                  </div>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}
