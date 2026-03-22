'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Plus, Workflow, Zap, FileEdit } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  ACTIVE:   { label: 'Activo',   color: 'bg-success/10 text-success border-success/20',      dot: 'bg-success' },
  DRAFT:    { label: 'Borrador', color: 'bg-surface-muted text-text-secondary border-border', dot: 'bg-text-muted' },
  INACTIVE: { label: 'Inactivo', color: 'bg-warning/10 text-warning border-warning/20',       dot: 'bg-warning' },
};

export default function FlowsPage() {
  const { data: flows, isLoading } = useQuery({
    queryKey: ['flows'],
    queryFn: () => api.get<any[]>('/flows'),
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Flujos</h1>
          <p className="text-text-secondary text-sm mt-1">Constructor de conversaciones automatizadas</p>
        </div>
        <button className="btn-primary"><Plus size={16} /> Nuevo flujo</button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse space-y-3">
              <div className="flex justify-between">
                <div className="w-10 h-10 rounded-lg bg-surface-muted" />
                <div className="w-16 h-5 bg-surface-muted rounded-full" />
              </div>
              <div className="w-40 h-4 bg-surface-muted rounded" />
              <div className="w-full h-3 bg-surface-muted rounded" />
            </div>
          ))}
        </div>
      ) : flows?.length === 0 ? (
        <div className="card py-20 text-center">
          <Workflow size={36} className="text-text-muted mx-auto mb-3" />
          <p className="font-semibold text-text-secondary">Sin flujos aún</p>
          <p className="text-sm text-text-muted mt-1">Diseña tu primer flujo de conversación</p>
          <button className="btn-primary mt-4 mx-auto"><Plus size={16} /> Nuevo flujo</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {flows?.map((flow: any) => {
            const st = STATUS_MAP[flow.status] ?? STATUS_MAP.DRAFT;
            return (
              <Link key={flow.id} href={`/flows/${flow.id}`}>
                <div className="card p-5 hover:shadow-card-hover transition-all duration-200 cursor-pointer group h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                      <Workflow size={18} className="text-primary-500" />
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${st.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </div>
                  </div>
                  <h3 className="font-semibold text-text-primary group-hover:text-primary-600 transition-colors text-sm">{flow.name}</h3>
                  {flow.description && (
                    <p className="text-xs text-text-secondary mt-1.5 line-clamp-2">{flow.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <Zap size={11} /> Abrir builder
                    </span>
                    <span className="flex items-center gap-1 text-xs text-text-muted ml-auto">
                      <FileEdit size={11} /> Editar
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
