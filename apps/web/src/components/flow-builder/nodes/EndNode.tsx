import { Handle, Position } from '@xyflow/react';

export function EndNode() {
  return (
    <div className="bg-red-50 border-2 border-red-400 rounded-xl px-4 py-3 min-w-32 shadow-sm">
      <Handle type="target" position={Position.Top} className="!bg-red-400" />
      <p className="text-xs font-bold text-red-700 uppercase tracking-wider text-center">Fin</p>
    </div>
  );
}
