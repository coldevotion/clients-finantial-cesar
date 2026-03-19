'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

const statusColors: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function TemplatesPage() {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => api.get<any[]>('/templates'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Plantillas</h1>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          Nueva plantilla
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates?.map((t: any) => (
            <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.category} · {t.language}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[t.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {t.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
