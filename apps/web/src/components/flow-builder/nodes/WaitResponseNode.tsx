import { Handle, Position } from '@xyflow/react';

export function WaitResponseNode({ data }: { data: any }) {
  return (
    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl px-4 py-3 min-w-48 shadow-sm">
      <Handle type="target" position={Position.Top} className="!bg-yellow-400" />
      <p className="text-xs font-bold text-yellow-700 uppercase tracking-wider">Esperar respuesta</p>
      <p className="text-sm text-gray-500 mt-1">
        Timeout: {data.config?.timeoutHours ?? '24'}h
      </p>
      <Handle type="source" position={Position.Bottom} className="!bg-yellow-400" />
    </div>
  );
}
