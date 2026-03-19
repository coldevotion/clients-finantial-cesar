import { Handle, Position } from '@xyflow/react';

export function DelayNode({ data }: { data: any }) {
  return (
    <div className="bg-gray-50 border-2 border-gray-400 rounded-xl px-4 py-3 min-w-40 shadow-sm">
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Delay</p>
      <p className="text-sm text-gray-500 mt-1">{data.config?.delayMinutes ?? 60} min</p>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
}
