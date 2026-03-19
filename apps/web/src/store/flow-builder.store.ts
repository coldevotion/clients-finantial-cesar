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
  selectNode: (nodeId: string | null) => void;
  setIsSaving: (saving: boolean) => void;
  markClean: () => void;
}

let nodeIdCounter = 0;

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
    set((state) => ({
      edges: addEdge(connection, state.edges),
      isDirty: true,
    })),

  addNode: (type, position) => {
    const id = `node_${++nodeIdCounter}`;
    const newNode: Node = {
      id,
      type,
      position,
      data: { label: type, config: {} },
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

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  setIsSaving: (isSaving) => set({ isSaving }),
  markClean: () => set({ isDirty: false }),
}));
