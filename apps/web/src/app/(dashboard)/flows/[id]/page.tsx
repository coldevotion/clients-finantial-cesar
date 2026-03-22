'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { ArrowLeft, Play, Pause, Loader2, Keyboard } from 'lucide-react';

const FlowCanvas = dynamic(() => import('@/components/flow-builder/FlowCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#0C1220]">
      <div className="flex items-center gap-3 text-slate-400">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm font-medium">Cargando canvas...</span>
      </div>
    </div>
  ),
});

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
  ACTIVE:   { label: 'Activo',   dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  DRAFT:    { label: 'Borrador', dot: 'bg-slate-400',   text: 'text-slate-400',   bg: 'bg-slate-500/15',   border: 'border-slate-500/30'   },
  INACTIVE: { label: 'Inactivo', dot: 'bg-amber-400',   text: 'text-amber-400',   bg: 'bg-amber-500/15',   border: 'border-amber-500/30'   },
};

export default function FlowBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: flow, isLoading } = useQuery({
    queryKey: ['flows', id],
    queryFn: () => api.get<any>(`/flows/${id}`),
  });

  const saveMutation = useMutation({
    mutationFn: (data: { nodes: any[]; edges: any[] }) => api.put(`/flows/${id}/graph`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flows', id] }),
  });

  const toggleActive = useMutation({
    mutationFn: () =>
      flow?.status === 'ACTIVE'
        ? api.post(`/flows/${id}/deactivate`, {})
        : api.post(`/flows/${id}/activate`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flows', id] }),
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center -m-8 h-screen bg-[#0C1220]">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm font-medium">Cargando flujo...</span>
        </div>
      </div>
    );
  }

  if (!flow) return null;

  const st = STATUS_CONFIG[flow.status] ?? STATUS_CONFIG.DRAFT;
  const isActive = flow.status === 'ACTIVE';

  return (
    <div className="h-full flex flex-col -m-8">

      {/* ── Toolbar ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#111827] border-b border-white/8 flex-shrink-0">

        {/* Back */}
        <Link
          href="/flows"
          className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors flex-shrink-0"
          aria-label="Volver a flujos"
        >
          <ArrowLeft size={16} />
        </Link>

        <div className="w-px h-5 bg-white/10 flex-shrink-0" />

        {/* Flow info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-none truncate">{flow.name}</p>
            {flow.description && (
              <p className="text-slate-500 text-[11px] mt-0.5 truncate">{flow.description}</p>
            )}
          </div>
          {/* Status badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border flex-shrink-0 ${st.bg} ${st.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot} ${isActive ? 'animate-pulse-soft' : ''}`} />
            <span className={st.text}>{st.label}</span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Keyboard hint */}
        <div className="hidden lg:flex items-center gap-1.5 text-slate-600 text-[10px]">
          <Keyboard size={11} />
          <span>Del para eliminar nodo seleccionado</span>
        </div>

        <div className="w-px h-5 bg-white/10 flex-shrink-0" />

        {/* Toggle active */}
        <button
          onClick={() => toggleActive.mutate()}
          disabled={toggleActive.isPending}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer disabled:opacity-50 active:scale-95
            ${isActive
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
              : 'text-white border border-white/15 hover:bg-white/10'
            }`}
          style={!isActive ? { background: '#267EF0' } : undefined}
        >
          {toggleActive.isPending
            ? <><Loader2 size={12} className="animate-spin" /> {isActive ? 'Desactivando...' : 'Activando...'}</>
            : isActive
              ? <><Pause size={12} /> Desactivar</>
              : <><Play  size={12} /> Activar flujo</>
          }
        </button>
      </div>

      {/* ── Canvas — takes remaining height ───────────────────── */}
      <div className="flex-1 overflow-hidden">
        <FlowCanvas
          initialNodes={flow.nodes ?? []}
          initialEdges={flow.edges ?? []}
          onSave={(nodes, edges) => saveMutation.mutate({ nodes, edges })}
          isSaving={saveMutation.isPending}
        />
      </div>
    </div>
  );
}
