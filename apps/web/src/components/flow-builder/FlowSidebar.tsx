'use client';

import { useFlowBuilderStore } from '@/store/flow-builder.store';
import { NodeType } from '@wa/types';

const nodeDefinitions = [
  { type: NodeType.TRIGGER, label: 'Trigger', description: 'Inicio del flujo', color: 'bg-purple-100 text-purple-700' },
  { type: NodeType.SEND_MESSAGE, label: 'Enviar mensaje', description: 'Envía texto al contacto', color: 'bg-blue-100 text-blue-700' },
  { type: NodeType.WAIT_RESPONSE, label: 'Esperar respuesta', description: 'Pausa hasta recibir reply', color: 'bg-yellow-100 text-yellow-700' },
  { type: NodeType.CONDITION, label: 'Condición', description: 'Bifurcación según respuesta', color: 'bg-orange-100 text-orange-700' },
  { type: NodeType.DELAY, label: 'Delay', description: 'Espera un tiempo fijo', color: 'bg-gray-100 text-gray-700' },
  { type: NodeType.WEBHOOK_CALL, label: 'Webhook', description: 'Llama a API externa', color: 'bg-teal-100 text-teal-700' },
  { type: NodeType.ASSIGN_TAG, label: 'Etiquetar', description: 'Agrega tag al contacto', color: 'bg-pink-100 text-pink-700' },
  { type: NodeType.END, label: 'Fin', description: 'Termina el flujo', color: 'bg-red-100 text-red-700' },
];

export function FlowSidebar() {
  const addNode = useFlowBuilderStore((s) => s.addNode);

  const onDragStart = (e: React.DragEvent, type: NodeType) => {
    e.dataTransfer.setData('nodeType', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-56 bg-white border-r border-gray-200 p-3 overflow-y-auto">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">Nodos</p>
      <div className="space-y-1.5">
        {nodeDefinitions.map((def) => (
          <div
            key={def.type}
            draggable
            onDragStart={(e) => onDragStart(e, def.type)}
            onClick={() => addNode(def.type, { x: 200, y: 200 })}
            className="p-2.5 rounded-lg border border-gray-100 cursor-grab hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2">
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${def.color}`}>
                {def.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{def.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
