'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { MessageSquare, CircleDot } from 'lucide-react';

export default function ConversationsPage() {
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get<any[]>('/conversations'),
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Conversaciones</h1>
        <p className="text-text-secondary text-sm mt-1">Historial de conversaciones de tus flujos</p>
      </div>

      {isLoading ? (
        <div className="card divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-surface-muted flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="w-36 h-4 bg-surface-muted rounded" />
                <div className="w-64 h-3 bg-surface-muted rounded" />
              </div>
              <div className="w-14 h-5 bg-surface-muted rounded-full" />
            </div>
          ))}
        </div>
      ) : conversations?.length === 0 ? (
        <div className="card py-20 text-center">
          <MessageSquare size={36} className="text-text-muted mx-auto mb-3" />
          <p className="font-semibold text-text-secondary">Sin conversaciones</p>
          <p className="text-sm text-text-muted mt-1">Las conversaciones aparecerán aquí cuando tus flujos respondan</p>
        </div>
      ) : (
        <div className="card overflow-hidden divide-y divide-border">
          {conversations?.map((conv: any) => {
            const isOpen = conv.status === 'OPEN';
            const name   = conv.contact?.name ?? conv.contact?.phone ?? 'Desconocido';
            const preview = conv.messages?.[0]?.content?.text ?? 'Sin mensajes';
            const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

            return (
              <Link key={conv.id} href={`/conversations/${conv.id}`}>
                <div className="flex items-center gap-4 px-5 py-4 hover:bg-surface-muted/50 transition-colors cursor-pointer group">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary-600">{initials}</span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary text-sm group-hover:text-primary-600 transition-colors">{name}</p>
                    <p className="text-xs text-text-muted mt-0.5 truncate">{preview}</p>
                  </div>
                  {/* Status */}
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border flex-shrink-0
                    ${isOpen
                      ? 'bg-success/10 text-success border-success/20'
                      : 'bg-surface-muted text-text-muted border-border'
                    }`}
                  >
                    <CircleDot size={10} />
                    {isOpen ? 'Abierta' : 'Cerrada'}
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
