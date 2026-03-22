import { CircleStop } from 'lucide-react';
import { BaseNode } from './BaseNode';

export function EndNode({ data, selected }: { data?: any; selected?: boolean }) {
  return (
    <BaseNode
      selected={selected}
      hasSource={false}
      accent="#EF4444"
      icon={<CircleStop />}
      typeLabel="Fin del flujo"
      label={data?.label ?? 'Completado'}
    >
      <p className="text-[11px] text-slate-400">La conversación termina aquí</p>
    </BaseNode>
  );
}
