import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { Node, Edge, Connection, NodeChange, EdgeChange, XYPosition } from '@xyflow/react';
import { NodeType } from '@wa/types';

interface FlowBuilderState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  isDirty: boolean;
  isSaving: boolean;

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: NodeType, position: XYPosition) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  deleteNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  setIsSaving: (saving: boolean) => void;
  markClean: () => void;
}

let nodeIdCounter = 0;

const NODE_DEFAULTS: Partial<Record<NodeType, Record<string, unknown>>> = {
  [NodeType.TRIGGER]:       { type: 'campaign' },
  [NodeType.SEND_MESSAGE]:  { messageType: 'text', text: '' },
  [NodeType.WAIT_RESPONSE]: { timeoutHours: 24, saveAs: '' },
  [NodeType.CONDITION]:     { variable: '', operator: 'equals', value: '' },
  [NodeType.DELAY]:         { delayMinutes: 60 },
  [NodeType.WEBHOOK_CALL]:  { url: '', method: 'POST', saveAs: '' },
  [NodeType.ASSIGN_TAG]:    { tags: [] },
};

const NODE_LABELS: Record<NodeType, string> = {
  [NodeType.TRIGGER]:       'Trigger',
  [NodeType.SEND_MESSAGE]:  'Enviar mensaje',
  [NodeType.WAIT_RESPONSE]: 'Esperar respuesta',
  [NodeType.CONDITION]:     'Condición',
  [NodeType.DELAY]:         'Delay',
  [NodeType.WEBHOOK_CALL]:  'Webhook',
  [NodeType.ASSIGN_TAG]:    'Etiquetar',
  [NodeType.END]:           'Fin',
};

export const useFlowBuilderStore = create<FlowBuilderState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isDirty: false,
  isSaving: false,

  setNodes: (nodes) => set({ nodes, isDirty: false }),
  setEdges: (edges) => set({ edges, isDirty: false }),

  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
      isDirty: true,
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      isDirty: true,
    })),

  onConnect: (connection) =>
    set((state) => {
      const sourceNode = state.nodes.find((n) => n.id === connection.source);
      let edgeStyle: Partial<Edge> = {
        style: { stroke: '#267EF0', strokeWidth: 2 },
      };

      // Condition node branches get colored edges + labels
      if (sourceNode?.type === NodeType.CONDITION) {
        const isTrue = connection.sourceHandle === 'true';
        edgeStyle = {
          label: isTrue ? 'Sí' : 'No',
          labelStyle: { fill: isTrue ? '#10B981' : '#EF4444', fontWeight: 600, fontSize: 11 },
          labelBgStyle: { fill: isTrue ? '#ECFDF5' : '#FEF2F2', borderRadius: 4 },
          labelBgPadding: [4, 6] as [number, number],
          style: { stroke: isTrue ? '#10B981' : '#EF4444', strokeWidth: 2 },
        };
      }

      return {
        edges: addEdge({ ...connection, ...edgeStyle }, state.edges),
        isDirty: true,
      };
    }),

  addNode: (type, position) => {
    const id = `node_${Date.now()}_${++nodeIdCounter}`;
    const newNode: Node = {
      id,
      type,
      position,
      data: {
        label: NODE_LABELS[type] ?? type,
        config: { ...(NODE_DEFAULTS[type] ?? {}) },
      },
    };
    set((state) => ({ nodes: [...state.nodes, newNode], isDirty: true }));
  },

  updateNodeData: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n,
      ),
      isDirty: true,
    })),

  deleteNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      isDirty: true,
    })),

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  setIsSaving: (isSaving) => set({ isSaving }),
  markClean: () => set({ isDirty: false }),
}));
