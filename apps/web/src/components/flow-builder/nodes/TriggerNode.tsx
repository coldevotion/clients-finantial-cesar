import { Handle, Position } from '@xyflow/react';

export function TriggerNode({ data }: { data: any }) {
  return (
    <div className="bg-purple-50 border-2 border-purple-400 rounded-xl px-4 py-3 min-w-40 shadow-sm">
      <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Trigger</p>
      <p className="text-sm font-medium text-gray-800 mt-1">{data.label ?? 'Inicio'}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-purple-400" />
    </div>
  );
}
