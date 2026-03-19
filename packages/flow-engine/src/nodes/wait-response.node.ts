import type { FlowNode, WaitResponseNodeConfig } from '@wa/types';
import type { NodeHandler, NodeExecutionResult, FlowExecutionState } from '../types';

export class WaitResponseNode implements NodeHandler {
  async execute(
    node: FlowNode,
    state: FlowExecutionState,
    inboundMessage: string | undefined,
  ): Promise<NodeExecutionResult> {
    const config = node.config as WaitResponseNodeConfig;

    if (!inboundMessage) {
      // No message yet — pause and wait
      return { waitForResponse: true };
    }

    // Message received — save it to context and continue
    return {
      nextNodeId: node.id, // will be resolved to next edge by engine
      updatedContext: { [config.saveAs]: inboundMessage },
    };
  }
}
