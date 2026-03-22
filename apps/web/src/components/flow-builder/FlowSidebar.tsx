'use client';

import { useState } from 'react';
import { useFlowBuilderStore } from '@/store/flow-builder.store';
import { NodeType } from '@wa/types';
import {
  Zap, MessageSquare, Clock, GitBranch,
  Timer, Globe, Tag, CircleStop, Search, ChevronDown,
} from 'lucide-react';

interface NodeDef {
  type: NodeType;
  label: string;
  description: string;
  icon: React.ElementType;
  accent: string;
}

const CATEGORIES: Array<{ label: string; nodes: NodeDef[] }> = [
  {
    label: 'Mensajería',
    nodes: [
      { type: NodeType.TRIGGER,       label: 'Trigger',           description: 'Punto de entrada del flujo',   icon: Zap,          accent: '#267EF0' },
      { type: NodeType.SEND_MESSAGE,  label: 'Enviar mensaje',    description: 'Texto libre o plantilla WA',   icon: MessageSquare, accent: '#10B981' },
      { type: NodeType.WAIT_RESPONSE, label: 'Esperar respuesta', description: 'Pausa hasta recibir reply',    icon: Clock,        accent: '#F59E0B' },
    ],
  },
  {
    label: 'Lógica',
    nodes: [
      { type: NodeType.CONDITION,     label: 'Condición',         description: 'Bifurca el flujo Sí / No',    icon: GitBranch,    accent: '#F97316' },
      { type: NodeType.DELAY,         label: 'Delay',             description: 'Espera un tiempo fijo',       icon: Timer,        accent: '#8B5CF6' },
      { type: NodeType.END,           label: 'Fin',               description: 'Termina la conversación',     icon: CircleStop,   accent: '#EF4444' },
    ],
  },
  {
    label: 'Integraciones',
    nodes: [
      { type: NodeType.WEBHOOK_CALL,  label: 'Webhook',           description: 'Llama a una API externa',     icon: Globe,        accent: '#14B8A6' },
      { type: NodeType.ASSIGN_TAG,    label: 'Etiquetar',         description: 'Agrega tag al contacto',      icon: Tag,          accent: '#EC4899' },
    ],
  },
];

export function FlowSidebar() {
  const addNode = useFlowBuilderStore((s) => s.addNode);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filteredCategories = CATEGORIES.map((cat) => ({
    ...cat,
    nodes: cat.nodes.filter(
      (n) =>
        !search ||
        n.label.toLowerCase().includes(search.toLowerCase()) ||
        n.description.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((cat) => cat.nodes.length > 0);

  const onDragStart = (e: React.DragEvent, type: NodeType) => {
    e.dataTransfer.setData('nodeType', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const toggleCategory = (label: string) =>
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <div className="w-60 flex flex-col overflow-hidden bg-[#111827] border-r border-white/8">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-white/8">
        <p className="text-white text-[11px] font-bold uppercase tracking-widest mb-3">Nodos</p>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nodo..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-[#267EF0]/60 focus:bg-white/8 transition-colors"
          />
        </div>
      </div>

      {/* ── Node list ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5">
        {filteredCategories.map((cat) => (
          <div key={cat.label}>
            {/* Category header */}
            <button
              onClick={() => toggleCategory(cat.label)}
              className="w-full flex items-center justify-between px-4 py-1.5 cursor-pointer hover:bg-white/5 transition-colors group"
            >
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-400 transition-colors">
                {cat.label}
              </span>
              <ChevronDown
                size={12}
                className={`text-slate-600 transition-transform duration-200 ${collapsed[cat.label] ? '-rotate-90' : ''}`}
              />
            </button>

            {/* Nodes */}
            {!collapsed[cat.label] && (
              <div className="px-2 pb-1 space-y-0.5">
                {cat.nodes.map((def) => {
                  const Icon = def.icon;
                  return (
                    <div
                      key={def.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, def.type)}
                      onClick={() => addNode(def.type, { x: 300 + Math.random() * 100, y: 300 + Math.random() * 100 })}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-grab active:cursor-grabbing
                                 border border-transparent hover:border-white/10 hover:bg-white/5
                                 transition-all duration-150 group/node"
                    >
                      {/* Icon dot */}
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-150 group-hover/node:scale-105"
                        style={{ backgroundColor: `${def.accent}25` }}
                      >
                        <Icon size={13} style={{ color: def.accent }} />
                      </div>
                      {/* Text */}
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-slate-300 group-hover/node:text-white transition-colors leading-tight">{def.label}</p>
                        <p className="text-[10px] text-slate-600 group-hover/node:text-slate-500 transition-colors truncate mt-0.5">{def.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Tip ───────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-white/8">
        <p className="text-[10px] text-slate-600 leading-relaxed">
          Arrastra nodos al canvas o haz clic para agregar. Conecta el punto inferior al superior del siguiente nodo.
        </p>
      </div>
    </div>
  );
}
