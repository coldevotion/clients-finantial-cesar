'use client';

import { useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
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

const nodeTypes = {
  trigger: TriggerNode,
  send_message: SendMessageNode,
  wait_response: WaitResponseNode,
  condition: ConditionNode,
  delay: DelayNode,
  end: EndNode,
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
    selectNode, markClean,
  } = useFlowBuilderStore();

  const autoSaveRef = useRef<ReturnType<typeof setTimeout>>();

  // Initialize from props
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Auto-save after 3s of inactivity
  useEffect(() => {
    if (!isDirty) return;
    clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      onSave(nodes, edges);
      markClean();
    }, 3000);
    return () => clearTimeout(autoSaveRef.current);
  }, [isDirty, nodes, edges, onSave, markClean]);

  const onNodeClick = useCallback((_: unknown, node: any) => {
    selectNode(node.id);
  }, [selectNode]);

  return (
    <div className="flex h-full">
      <FlowSidebar />
      <div className="flex-1 relative">
        <div className="absolute top-4 right-4 z-10 bg-white px-3 py-1.5 rounded-lg shadow text-xs text-gray-500">
          {isSaving ? 'Guardando...' : isDirty ? 'Cambios sin guardar' : 'Guardado'}
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
          <Controls />
          <MiniMap className="!bg-gray-50" />
        </ReactFlow>
      </div>
      <NodeConfigPanel />
    </div>
  );
}
