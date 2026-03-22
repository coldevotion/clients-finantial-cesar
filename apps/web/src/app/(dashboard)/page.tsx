'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Megaphone, MessageSquare, Eye, MessagesSquare, TrendingUp } from 'lucide-react';

const statConfig = [
  { key: 'campaignsSent',        label: 'Campañas enviadas',       icon: Megaphone,       color: 'text-primary-500',  bg: 'bg-primary-50',  fmt: (v: number) => v.toLocaleString() },
  { key: 'messagesDelivered',    label: 'Mensajes entregados',     icon: MessageSquare,   color: 'text-success',      bg: 'bg-success/10',  fmt: (v: number) => v.toLocaleString() },
  { key: 'readRate',             label: 'Tasa de lectura',         icon: Eye,             color: 'text-warning',      bg: 'bg-warning/10',  fmt: (v: number) => `${v}%` },
  { key: 'activeConversations',  label: 'Conversaciones activas',  icon: MessagesSquare,  color: 'text-accent',       bg: 'bg-accent/10',   fmt: (v: number) => v.toLocaleString() },
];

function StatSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-surface-muted" />
        <div className="w-16 h-4 rounded bg-surface-muted" />
      </div>
      <div className="w-20 h-8 rounded bg-surface-muted mb-1" />
      <div className="w-32 h-3 rounded bg-surface-muted" />
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => api.get<Record<string, number>>('/analytics/dashboard'),
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">Resumen general de tu plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : statConfig.map(({ key, label, icon: Icon, color, bg, fmt }) => (
            <div key={key} className="card p-6 hover:shadow-card-hover transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon size={18} className={color} />
                </div>
                <div className="flex items-center gap-1 text-xs text-success font-medium">
                  <TrendingUp size={12} />
                  +12%
                </div>
              </div>
              <p className="text-2xl font-bold text-text-primary tabular-nums">
                {data ? fmt(data[key] ?? 0) : '—'}
              </p>
              <p className="text-sm text-text-secondary mt-0.5">{label}</p>
            </div>
          ))
        }
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { title: 'Nueva campaña', desc: 'Envía mensajes masivos a tus contactos', href: '/campaigns', color: 'bg-primary-500' },
          { title: 'Crear flujo',   desc: 'Diseña conversaciones automatizadas',   href: '/flows',     color: 'bg-accent' },
          { title: 'Ver reportes',  desc: 'Analiza el rendimiento de tus campañas', href: '/analytics', color: 'bg-success' },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="card p-5 flex items-center gap-4 hover:shadow-card-hover transition-shadow duration-200 cursor-pointer group"
          >
            <div className={`w-10 h-10 rounded-lg ${item.color} flex-shrink-0`} />
            <div className="min-w-0">
              <p className="font-semibold text-text-primary text-sm group-hover:text-primary-600 transition-colors">{item.title}</p>
              <p className="text-xs text-text-secondary mt-0.5 truncate">{item.desc}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
