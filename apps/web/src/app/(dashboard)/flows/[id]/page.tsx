'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api-client';

// Load FlowCanvas only on client (React Flow needs browser)
const FlowCanvas = dynamic(() => import('@/components/flow-builder/FlowCanvas'), { ssr: false });

export default function FlowBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: flow, isLoading } = useQuery({
    queryKey: ['flows', id],
    queryFn: () => api.get<any>(`/flows/${id}`),
  });

  const saveMutation = useMutation({
    mutationFn: (data: { nodes: any[]; edges: any[] }) =>
      api.put(`/flows/${id}/graph`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flows', id] }),
  });

  if (isLoading) return <div className="flex items-center justify-center h-full text-gray-500">Cargando flujo...</div>;
  if (!flow) return null;

  return (
    <div className="h-full flex flex-col -m-8">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{flow.name}</h1>
          <span className="text-xs text-gray-500">{flow.status}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => api.post(`/flows/${id}/activate`, {})}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            Activar flujo
          </button>
        </div>
      </div>
      <div className="flex-1">
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
