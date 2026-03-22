import { GitBranch } from 'lucide-react';
import { BaseNode } from './BaseNode';

const OPERATOR_LABELS: Record<string, string> = {
  equals:      '=',
  contains:    'contiene',
  startsWith:  'empieza con',
  greaterThan: '>',
  lessThan:    '<',
};

export function ConditionNode({ data, selected }: { data: any; selected?: boolean }) {
  const { variable, operator, value } = data.config ?? {};

  return (
    <BaseNode
      selected={selected}
      accent="#F97316"
      icon={<GitBranch />}
      typeLabel="Condición"
      label={data.label ?? 'Si/No'}
      sourceCount={2}
    >
      {variable && (
        <div className="font-mono text-[10px] text-slate-400 bg-white/5 rounded-md px-2 py-1.5 leading-relaxed">
          <span className="text-slate-200">{variable}</span>{' '}
          <span className="text-orange-400">{OPERATOR_LABELS[operator] ?? operator}</span>{' '}
          <span className="text-emerald-400">"{value}"</span>
        </div>
      )}
      {!variable && (
        <p className="text-[11px] text-slate-500 italic">Sin condición configurada</p>
      )}
    </BaseNode>
  );
}
