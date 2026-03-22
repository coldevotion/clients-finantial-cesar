import { Handle, Position } from '@xyflow/react';
import type { ReactNode } from 'react';

export interface BaseNodeProps {
  selected?: boolean;
  hasTarget?: boolean;
  hasSource?: boolean;
  sourceCount?: 1 | 2;
  accent: string;
  icon: ReactNode;
  typeLabel: string;
  label: string;
  children?: ReactNode;
}

export function BaseNode({
  selected = false,
  hasTarget = true,
  hasSource = true,
  sourceCount = 1,
  accent,
  icon,
  typeLabel,
  label,
  children,
}: BaseNodeProps) {
  return (
    <div
      style={{
        border: `2px solid ${selected ? accent : 'rgba(255,255,255,0.12)'}`,
        boxShadow: selected
          ? `0 0 0 4px ${accent}30, 0 8px 32px rgba(0,0,0,0.5)`
          : '0 4px 16px rgba(0,0,0,0.4)',
        minWidth: 220,
      }}
      className="relative bg-[#1C2333] rounded-xl overflow-visible cursor-pointer transition-all duration-200"
    >
      {/* ── Target handle — TOP ─────────────────────────────────── */}
      {hasTarget && (
        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: accent,
            border: '3px solid #0C1220',
            width: 16,
            height: 16,
            cursor: 'crosshair',
          }}
        />
      )}

      {/* ── Colored header ─────────────────────────────────────── */}
      <div
        style={{ backgroundColor: accent }}
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-t-[10px]"
      >
        <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center flex-shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5 [&>svg]:text-white">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-white/70 text-[9px] font-bold uppercase tracking-widest leading-none">
            {typeLabel}
          </p>
          <p className="text-white text-[13px] font-semibold leading-snug mt-0.5 truncate">
            {label}
          </p>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      {children && (
        <div className="px-3.5 py-2.5">
          {children}
        </div>
      )}

      {/* ── Source handle(s) — BOTTOM ──────────────────────────── */}
      {hasSource && sourceCount === 1 && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            background: accent,
            border: '3px solid #0C1220',
            width: 16,
            height: 16,
            cursor: 'crosshair',
          }}
        />
      )}

      {hasSource && sourceCount === 2 && (
        <>
          {/* Sí / true — left */}
          <Handle
            type="source"
            id="true"
            position={Position.Bottom}
            style={{
              background: '#10B981',
              border: '3px solid #0C1220',
              width: 16,
              height: 16,
              left: '28%',
              cursor: 'crosshair',
            }}
          />
          {/* No / false — right */}
          <Handle
            type="source"
            id="false"
            position={Position.Bottom}
            style={{
              background: '#EF4444',
              border: '3px solid #0C1220',
              width: 16,
              height: 16,
              left: '72%',
              cursor: 'crosshair',
            }}
          />
          {/* Branch labels above handles */}
          <div className="flex justify-between px-6 pb-2 pt-1">
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Sí</span>
            <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">No</span>
          </div>
        </>
      )}
    </div>
  );
}
