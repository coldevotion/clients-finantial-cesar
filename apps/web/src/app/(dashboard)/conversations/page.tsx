'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api-client';

export default function ConversationsPage() {
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get<any[]>('/conversations'),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Conversaciones</h1>
      {isLoading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {conversations?.map((conv: any) => (
            <Link key={conv.id} href={`/conversations/${conv.id}`}>
              <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900">{conv.contact?.name ?? conv.contact?.phone}</p>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                    {conv.messages?.[0]?.content?.text ?? 'Sin mensajes'}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${conv.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {conv.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
