import { Handle, Position } from '@xyflow/react';

export function ConditionNode({ data }: { data: any }) {
  const rules = data.config?.rules ?? [];
  return (
    <div className="bg-orange-50 border-2 border-orange-400 rounded-xl px-4 py-3 min-w-48 shadow-sm">
      <Handle type="target" position={Position.Top} className="!bg-orange-400" />
      <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">Condición</p>
      <p className="text-sm text-gray-500 mt-1">{rules.length} regla{rules.length !== 1 ? 's' : ''}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-orange-400" />
    </div>
  );
}
