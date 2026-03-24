import type { FlowNode, FlowEdge, FlowContext } from '@wa/types';

export interface FlowExecutionState {
  executionId: string;
  flowId: string;
  tenantId: string;
  conversationId: string;
  currentNodeId: string;
  status: 'RUNNING' | 'WAITING' | 'COMPLETED' | 'FAILED';
  context: FlowContext;
}

export interface NodeExecutionResult {
  nextNodeId?: string;
  waitForResponse?: boolean;
  updatedContext?: Partial<FlowContext>;
  delayMs?: number;
  error?: string;
}

export interface NodeHandler {
  execute(
    node: FlowNode,
    state: FlowExecutionState,
    inboundMessage?: string,
    graph?: FlowGraph,
  ): Promise<NodeExecutionResult>;
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export function findNode(graph: FlowGraph, nodeId: string): FlowNode | undefined {
  return graph.nodes.find((n) => n.id === nodeId);
}

export function findNextNode(graph: FlowGraph, currentNodeId: string): string | undefined {
  const edge = graph.edges.find((e) => e.source === currentNodeId);
  return edge?.target;
}
