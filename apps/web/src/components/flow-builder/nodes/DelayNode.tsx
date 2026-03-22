import { Timer } from 'lucide-react';
import { BaseNode } from './BaseNode';

function formatDelay(minutes: number): string {
  if (minutes >= 1440) return `${(minutes / 1440).toFixed(0)} día${minutes / 1440 !== 1 ? 's' : ''}`;
  if (minutes >= 60)   return `${(minutes / 60).toFixed(1)}h`;
  return `${minutes} min`;
}

export function DelayNode({ data, selected }: { data: any; selected?: boolean }) {
  const mins = data.config?.delayMinutes ?? 60;

  return (
    <BaseNode
      selected={selected}
      accent="#8B5CF6"
      icon={<Timer />}
      typeLabel="Delay"
      label={data.label ?? 'Esperar'}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
          <Timer size={14} className="text-violet-400" />
        </div>
        <div>
          <p className="text-base font-bold text-violet-400 leading-none">{formatDelay(mins)}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{mins} minutos</p>
        </div>
      </div>
    </BaseNode>
  );
}
