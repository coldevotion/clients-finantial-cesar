import { Zap } from 'lucide-react';
import { BaseNode } from './BaseNode';

export function TriggerNode({ data, selected }: { data: any; selected?: boolean }) {
  const triggerType = data.config?.type === 'inbound' ? 'Mensaje entrante'
    : data.config?.type === 'keyword' ? 'Palabra clave'
    : 'Inicio de campaña';

  return (
    <BaseNode
      selected={selected}
      hasTarget={false}
      accent="#267EF0"
      icon={<Zap />}
      typeLabel="Trigger"
      label={data.label ?? 'Inicio'}
    >
      <p className="text-[11px] text-slate-400">{triggerType}</p>
    </BaseNode>
  );
}
