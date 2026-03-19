import type { FlowNode } from '@wa/types';
import type { NodeHandler, NodeExecutionResult } from '../types';

export class EndNode implements NodeHandler {
  async execute(_node: FlowNode): Promise<NodeExecutionResult> {
    return {}; // No nextNodeId = execution completes
  }
}
