import { Clock } from 'lucide-react';
import { BaseNode } from './BaseNode';

export function WaitResponseNode({ data, selected }: { data: any; selected?: boolean }) {
  const timeout = data.config?.timeoutHours ?? 24;
  const saveAs  = data.config?.saveAs;

  return (
    <BaseNode
      selected={selected}
      accent="#F59E0B"
      icon={<Clock />}
      typeLabel="Esperar respuesta"
      label={data.label ?? 'Esperar'}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <Clock size={10} className="text-slate-500 flex-shrink-0" />
          <span className="text-[11px] text-slate-400">Timeout: <span className="text-amber-400 font-semibold">{timeout}h</span></span>
        </div>
        {saveAs && (
          <div className="text-[10px] text-slate-500 font-mono truncate">
            → var: <span className="text-slate-300">{saveAs}</span>
          </div>
        )}
      </div>
    </BaseNode>
  );
}
