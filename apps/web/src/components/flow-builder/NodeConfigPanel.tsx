'use client';

import { useFlowBuilderStore } from '@/store/flow-builder.store';
import { NodeType } from '@wa/types';
import {
  X, Trash2, Settings2, Zap, MessageSquare, Clock,
  GitBranch, Timer, Globe, Tag, CircleStop,
} from 'lucide-react';

/* ── Meta by type ──────────────────────────────────────────────────── */
const NODE_META: Record<string, { label: string; icon: React.ElementType; accent: string }> = {
  [NodeType.TRIGGER]:       { label: 'Trigger',           icon: Zap,          accent: '#267EF0' },
  [NodeType.SEND_MESSAGE]:  { label: 'Enviar mensaje',    icon: MessageSquare, accent: '#10B981' },
  [NodeType.WAIT_RESPONSE]: { label: 'Esperar respuesta', icon: Clock,        accent: '#F59E0B' },
  [NodeType.CONDITION]:     { label: 'Condición',         icon: GitBranch,    accent: '#F97316' },
  [NodeType.DELAY]:         { label: 'Delay',             icon: Timer,        accent: '#8B5CF6' },
  [NodeType.WEBHOOK_CALL]:  { label: 'Webhook',           icon: Globe,        accent: '#14B8A6' },
  [NodeType.ASSIGN_TAG]:    { label: 'Etiquetar',         icon: Tag,          accent: '#EC4899' },
  [NodeType.END]:           { label: 'Fin del flujo',     icon: CircleStop,   accent: '#EF4444' },
};

/* ── Field wrapper ─────────────────────────────────────────────────── */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...rest}
      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#267EF0]/30 focus:border-[#267EF0] transition-colors"
    />
  );
}

function Select({ value, onChange, children }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#267EF0]/30 focus:border-[#267EF0] transition-colors"
    >
      {children}
    </select>
  );
}

function Textarea({ value, onChange, placeholder, rows = 4 }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#267EF0]/30 focus:border-[#267EF0] transition-colors resize-none"
    />
  );
}

/* ── Type-specific config fields ───────────────────────────────────── */
function ConfigFields({ type, config, onChange }: { type: string; config: any; onChange: (k: string, v: unknown) => void }) {
  switch (type) {
    case NodeType.TRIGGER:
      return (
        <Field label="Tipo de trigger">
          <Select value={config.type ?? 'campaign'} onChange={(e) => onChange('type', e.target.value)}>
            <option value="campaign">Inicio de campaña</option>
            <option value="inbound">Mensaje entrante</option>
            <option value="keyword">Palabra clave específica</option>
          </Select>
        </Field>
      );

    case NodeType.SEND_MESSAGE:
      return (
        <div className="space-y-3">
          <Field label="Tipo de mensaje">
            <Select value={config.messageType ?? 'text'} onChange={(e) => onChange('messageType', e.target.value)}>
              <option value="text">Texto libre</option>
              <option value="template">Plantilla de WA</option>
            </Select>
          </Field>
          {(config.messageType ?? 'text') === 'text' ? (
            <Field
              label="Contenido del mensaje"
              hint="Usa {{contact.name}}, {{contact.phone}} para personalizar"
            >
              <Textarea
                value={config.text ?? ''}
                onChange={(e) => onChange('text', (e.target as HTMLTextAreaElement).value)}
                placeholder="Hola {{contact.name}}, te recordamos que..."
                rows={5}
              />
            </Field>
          ) : (
            <Field label="Nombre de la plantilla">
              <Input
                value={config.templateName ?? ''}
                onChange={(e) => onChange('templateName', e.target.value)}
                placeholder="cobros_atrasados"
              />
            </Field>
          )}
        </div>
      );

    case NodeType.WAIT_RESPONSE:
      return (
        <div className="space-y-3">
          <Field label="Guardar respuesta en variable">
            <Input
              value={config.saveAs ?? ''}
              onChange={(e) => onChange('saveAs', e.target.value)}
              placeholder="respuesta_cliente"
            />
          </Field>
          <Field label="Timeout (horas sin respuesta)" hint="Después del timeout el flujo continúa por el branch de timeout">
            <Input
              type="number"
              value={config.timeoutHours ?? 24}
              onChange={(e) => onChange('timeoutHours', Number(e.target.value))}
              min={1}
              max={168}
            />
          </Field>
        </div>
      );

    case NodeType.CONDITION:
      return (
        <div className="space-y-3">
          <Field label="Variable a evaluar">
            <Input
              value={config.variable ?? ''}
              onChange={(e) => onChange('variable', e.target.value)}
              placeholder="respuesta_cliente"
            />
          </Field>
          <Field label="Operador">
            <Select value={config.operator ?? 'equals'} onChange={(e) => onChange('operator', e.target.value)}>
              <option value="equals">Es igual a</option>
              <option value="contains">Contiene</option>
              <option value="startsWith">Empieza con</option>
              <option value="greaterThan">Mayor que</option>
              <option value="lessThan">Menor que</option>
            </Select>
          </Field>
          <Field label="Valor">
            <Input
              value={config.value ?? ''}
              onChange={(e) => onChange('value', e.target.value)}
              placeholder="sí"
            />
          </Field>
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Handle inferior izquierdo = <strong>Sí</strong>
            </span>
            <span className="flex items-center gap-1.5 text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              <strong>No</strong>
            </span>
          </div>
        </div>
      );

    case NodeType.DELAY:
      return (
        <Field label="Tiempo de espera (minutos)">
          <Input
            type="number"
            value={config.delayMinutes ?? 60}
            onChange={(e) => onChange('delayMinutes', Number(e.target.value))}
            min={1}
          />
          <p className="text-[10px] text-slate-400 mt-1">
            {config.delayMinutes >= 1440
              ? `${Math.floor(config.delayMinutes / 1440)} día(s) y ${Math.floor((config.delayMinutes % 1440) / 60)}h`
              : config.delayMinutes >= 60
                ? `${(config.delayMinutes / 60).toFixed(1)} horas`
                : `${config.delayMinutes ?? 60} minutos`
            }
          </p>
        </Field>
      );

    case NodeType.WEBHOOK_CALL:
      return (
        <div className="space-y-3">
          <Field label="URL del endpoint">
            <Input value={config.url ?? ''} onChange={(e) => onChange('url', e.target.value)} placeholder="https://api.tuapp.com/webhook" type="url" />
          </Field>
          <Field label="Método HTTP">
            <Select value={config.method ?? 'POST'} onChange={(e) => onChange('method', e.target.value)}>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
            </Select>
          </Field>
          <Field label="Guardar respuesta en variable">
            <Input value={config.saveAs ?? ''} onChange={(e) => onChange('saveAs', e.target.value)} placeholder="webhook_response" />
          </Field>
        </div>
      );

    case NodeType.ASSIGN_TAG:
      return (
        <Field label="Tags a asignar" hint="Separados por coma. Ej: vip, cobro, nuevo">
          <Input
            value={(config.tags ?? []).join(', ')}
            onChange={(e) => onChange('tags', e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean))}
            placeholder="vip, cobro, nuevo"
          />
        </Field>
      );

    default:
      return <p className="text-xs text-slate-400 italic">Este nodo no requiere configuración adicional.</p>;
  }
}

/* ── Main component ────────────────────────────────────────────────── */
export function NodeConfigPanel() {
  const { selectedNodeId, nodes, updateNodeData, selectNode, deleteNode } = useFlowBuilderStore();

  /* Empty state */
  if (!selectedNodeId) {
    return (
      <div className="w-72 bg-white border-l border-slate-200 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Settings2 size={24} className="text-slate-300" />
        </div>
        <div>
          <p className="font-semibold text-slate-700 text-sm">Ningún nodo seleccionado</p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">Haz clic en un nodo del canvas para ver y editar su configuración</p>
        </div>
      </div>
    );
  }

  const node   = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const meta    = NODE_META[node.type as string] ?? { label: node.type, icon: Settings2, accent: '#267EF0' };
  const MetaIcon = meta.icon;
  const config  = (node.data?.config as Record<string, any>) ?? {};
  const onChange = (key: string, value: unknown) =>
    updateNodeData(node.id, { config: { ...config, [key]: value } });

  return (
    <div className="w-72 bg-white border-l border-slate-200 flex flex-col overflow-hidden">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${meta.accent}18` }}
        >
          <MetaIcon size={15} style={{ color: meta.accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: meta.accent }}>{meta.label}</p>
          <p className="text-sm font-bold text-slate-800 truncate">{(node.data?.label as string) || 'Sin nombre'}</p>
        </div>
        <button
          onClick={() => selectNode(null)}
          className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex-shrink-0"
          aria-label="Cerrar panel"
        >
          <X size={14} />
        </button>
      </div>

      {/* ── Fields ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Node label — always visible */}
        <Field label="Nombre del nodo">
          <Input
            value={(node.data?.label as string) ?? ''}
            onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
            placeholder="Nombre descriptivo..."
          />
        </Field>

        {/* Divider */}
        <div className="border-t border-slate-100 pt-4">
          <ConfigFields type={node.type as string} config={config} onChange={onChange} />
        </div>
      </div>

      {/* ── Footer: delete ────────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 space-y-1">
        <p className="text-[9px] text-slate-400 font-mono truncate">ID: {node.id}</p>
        <button
          onClick={() => {
            deleteNode(node.id);
            selectNode(null);
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 border border-red-200/50 hover:border-red-200 transition-all duration-150 cursor-pointer"
        >
          <Trash2 size={13} />
          Eliminar nodo
        </button>
      </div>
    </div>
  );
}
