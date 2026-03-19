'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function SessionsList() {
  const queryClient = useQueryClient();

  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get<any[]>('/users/me/sessions'),
  });

  const revoke = useMutation({
    mutationFn: (sessionId: string) => api.delete(`/users/me/sessions/${sessionId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Sesiones activas</h3>
      <div className="space-y-3">
        {sessions?.map((session: any) => (
          <div key={session.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-800">
                {session.userAgent?.substring(0, 60) ?? 'Dispositivo desconocido'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                IP: {session.ipAddress ?? '—'} · {new Date(session.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button onClick={() => revoke.mutate(session.id)}
              className="text-xs text-red-500 hover:text-red-700 font-medium">
              Revocar
            </button>
          </div>
        ))}
        {sessions?.length === 0 && <p className="text-sm text-gray-400">No hay sesiones activas.</p>}
      </div>
    </div>
  );
}
