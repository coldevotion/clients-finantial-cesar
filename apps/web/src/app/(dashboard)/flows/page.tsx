'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api-client';

export default function FlowsPage() {
  const { data: flows, isLoading } = useQuery({
    queryKey: ['flows'],
    queryFn: () => api.get<any[]>('/flows'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Flujos</h1>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          Nuevo flujo
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flows?.map((flow: any) => (
            <Link key={flow.id} href={`/flows/${flow.id}`}>
              <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-primary-500 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{flow.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    flow.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    flow.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {flow.status}
                  </span>
                </div>
                {flow.description && (
                  <p className="text-sm text-gray-500 mt-2">{flow.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
