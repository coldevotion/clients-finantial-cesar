import { MessageSquare } from 'lucide-react';
import { BaseNode } from './BaseNode';

export function SendMessageNode({ data, selected }: { data: any; selected?: boolean }) {
  const isTemplate = data.config?.messageType === 'template';
  const preview = isTemplate
    ? data.config?.templateName
    : data.config?.text;

  return (
    <BaseNode
      selected={selected}
      accent="#10B981"
      icon={<MessageSquare />}
      typeLabel="Enviar mensaje"
      label={data.label ?? 'Mensaje'}
    >
      {preview ? (
        <>
          <span
            className="inline-block text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded mb-1.5"
            style={isTemplate
              ? { backgroundColor: 'rgba(38,126,240,0.2)', color: '#267EF0' }
              : { backgroundColor: 'rgba(16,185,129,0.2)', color: '#10B981' }
            }>
            {isTemplate ? 'Plantilla' : 'Texto'}
          </span>
          <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">{preview}</p>
        </>
      ) : (
        <p className="text-[11px] text-slate-500 italic">Sin contenido configurado</p>
      )}
    </BaseNode>
  );
}
