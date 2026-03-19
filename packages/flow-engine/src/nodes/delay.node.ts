import type { FlowNode, DelayNodeConfig } from '@wa/types';
import type { NodeHandler, NodeExecutionResult, FlowExecutionState, FlowGraph } from '../types';
import { findNextNode } from '../types';

export class DelayNode implements NodeHandler {
  async execute(
    node: FlowNode,
    state: FlowExecutionState,
    _inboundMessage: string | undefined,
    graph: FlowGraph,
  ): Promise<NodeExecutionResult> {
    const config = node.config as DelayNodeConfig;
    const delayMs = config.delayMinutes * 60 * 1000;

    return {
      nextNodeId: findNextNode(graph, node.id),
      delayMs,
    };
  }
}
