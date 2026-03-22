'use client';

import { useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Panel,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFlowBuilderStore } from '@/store/flow-builder.store';
import { FlowSidebar } from './FlowSidebar';
import { NodeConfigPanel } from './NodeConfigPanel';
import { TriggerNode } from './nodes/TriggerNode';
import { SendMessageNode } from './nodes/SendMessageNode';
import { WaitResponseNode } from './nodes/WaitResponseNode';
import { ConditionNode } from './nodes/ConditionNode';
import { DelayNode } from './nodes/DelayNode';
import { EndNode } from './nodes/EndNode';
import { NodeType } from '@wa/types';
import { Save, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

const nodeTypes = {
  trigger:       TriggerNode,
  send_message:  SendMessageNode,
  wait_response: WaitResponseNode,
  condition:     ConditionNode,
  delay:         DelayNode,
  end:           EndNode,
};

const defaultEdgeOptions = {
  style: { stroke: '#267EF0', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#267EF0', width: 16, height: 16 },
};

interface FlowCanvasProps {
  initialNodes: any[];
  initialEdges: any[];
  onSave: (nodes: any[], edges: any[]) => void;
  isSaving: boolean;
}

export default function FlowCanvas({ initialNodes, initialEdges, onSave, isSaving }: FlowCanvasProps) {
  const {
    nodes, edges, isDirty,
    setNodes, setEdges,
    onNodesChange, onEdgesChange, onConnect,
    selectNode, addNode, deleteNode, selectedNodeId, markClean,
  } = useFlowBuilderStore();

  const autoSaveRef = useRef<ReturnType<typeof setTimeout>>();

  /* Initialize from props */
  useEffect(() => {
    setNodes(
      initialNodes.length
        ? initialNodes
        : [{ id: 'start', type: NodeType.TRIGGER, position: { x: 300, y: 80 }, data: { label: 'Inicio', config: { type: 'campaign' } } }],
    );
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  /* Auto-save after 3s of inactivity */
  useEffect(() => {
    if (!isDirty) return;
    clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      onSave(nodes, edges);
      markClean();
    }, 3000);
    return () => clearTimeout(autoSaveRef.current);
  }, [isDirty, nodes, edges, onSave, markClean]);

  /* Keyboard: Delete/Backspace removes selected node */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        deleteNode(selectedNodeId);
        selectNode(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedNodeId, deleteNode, selectNode]);

  const onNodeClick  = useCallback((_: unknown, node: any) => selectNode(node.id), [selectNode]);
  const onPaneClick  = useCallback(() => selectNode(null), [selectNode]);

  /* Drag & drop from sidebar */
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('nodeType') as NodeType;
      if (!type) return;
      const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect();
      addNode(type, { x: e.clientX - bounds.left - 110, y: e.clientY - bounds.top - 40 });
    },
    [addNode],
  );
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  return (
    <div className="flex h-full">
      <FlowSidebar />

      {/* ── Canvas ────────────────────────────────────────────── */}
      <div className="flex-1 relative" onDrop={onDrop} onDragOver={onDragOver}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionLineStyle={{ stroke: '#267EF0', strokeWidth: 2, strokeDasharray: '6 3' }}
          connectionLineContainerStyle={{ zIndex: 9999 }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          style={{ background: '#0C1220' }}
        >
          {/* Dark dot grid */}
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.2}
            color="rgba(100,116,139,0.35)"
          />

          {/* Controls — dark themed */}
          <Controls
            showInteractive={false}
            className="!bottom-5 !left-5 !rounded-xl !overflow-hidden !border !border-white/10 !shadow-lg"
            style={{ background: '#1C2333' }}
          />

          {/* Minimap */}
          <MiniMap
            className="!bottom-5 !right-5 !rounded-xl !border !border-white/10 !shadow-lg"
            style={{ background: '#111827' }}
            nodeColor={(n) => {
              const colors: Record<string, string> = {
                trigger: '#267EF0', send_message: '#10B981', wait_response: '#F59E0B',
                condition: '#F97316', delay: '#8B5CF6', webhook_call: '#14B8A6',
                assign_tag: '#EC4899', end: '#EF4444',
              };
              return colors[n.type ?? ''] ?? '#334155';
            }}
            maskColor="rgba(12,18,32,0.7)"
          />

          {/* Save status badge */}
          <Panel position="top-right">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border backdrop-blur-sm
              ${isSaving
                ? 'bg-[#1C2333]/90 text-slate-400 border-white/10'
                : isDirty
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}
            >
              {isSaving   && <><Loader2 size={12} className="animate-spin" /> Guardando...</>}
              {!isSaving && isDirty  && <><AlertCircle size={12} /> Sin guardar</>}
              {!isSaving && !isDirty && <><CheckCircle2 size={12} /> Guardado</>}
            </div>
          </Panel>

          {/* Manual save */}
          {isDirty && !isSaving && (
            <Panel position="top-center">
              <button
                onClick={() => { onSave(nodes, edges); markClean(); }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-lg cursor-pointer transition-all duration-150 hover:scale-105 active:scale-95"
                style={{ background: '#267EF0' }}
              >
                <Save size={12} /> Guardar ahora
              </button>
            </Panel>
          )}

          {/* Hint when canvas is empty */}
          {nodes.length === 0 && (
            <Panel position="top-center">
              <div className="mt-32 text-center">
                <p className="text-slate-500 text-sm font-medium">Arrastra nodos desde el panel izquierdo</p>
                <p className="text-slate-600 text-xs mt-1">o haz clic en un nodo para agregarlo</p>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      <NodeConfigPanel />
    </div>
  );
}
