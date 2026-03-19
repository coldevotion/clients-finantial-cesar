import { Handle, Position } from '@xyflow/react';

export function SendMessageNode({ data }: { data: any }) {
  return (
    <div className="bg-blue-50 border-2 border-blue-400 rounded-xl px-4 py-3 min-w-48 shadow-sm">
      <Handle type="target" position={Position.Top} className="!bg-blue-400" />
      <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Mensaje</p>
      <p className="text-sm text-gray-700 mt-1 line-clamp-2">{data.config?.content ?? 'Sin contenido'}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400" />
    </div>
  );
}
