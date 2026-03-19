'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api-client';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  RUNNING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function CampaignsPage() {
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.get<any[]>('/campaigns'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Campañas</h1>
        <Link href="/campaigns/new" className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          Nueva campaña
        </Link>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {campaigns?.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">{c.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">{c.template?.name}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right text-sm text-gray-500">
                  <p>{c.sent ?? 0} enviados</p>
                  <p>{c.delivered ?? 0} entregados</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[c.status] ?? 'bg-gray-100'}`}>
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
