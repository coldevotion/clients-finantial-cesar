'use client';

import { useFlowBuilderStore } from '@/store/flow-builder.store';

export function NodeConfigPanel() {
  const { selectedNodeId, nodes, updateNodeData } = useFlowBuilderStore();

  if (!selectedNodeId) {
    return (
      <div className="w-72 bg-white border-l border-gray-200 flex items-center justify-center">
        <p className="text-sm text-gray-400">Selecciona un nodo para configurarlo</p>
      </div>
    );
  }

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  return (
    <div className="w-72 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <h3 className="font-semibold text-gray-900 mb-4">{node.type}</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
          <input
            type="text"
            value={(node.data?.label as string) ?? ''}
            onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Configuración (JSON)</label>
          <textarea
            rows={8}
            value={JSON.stringify(node.data?.config ?? {}, null, 2)}
            onChange={(e) => {
              try {
                updateNodeData(node.id, { config: JSON.parse(e.target.value) });
              } catch {}
            }}
            className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
