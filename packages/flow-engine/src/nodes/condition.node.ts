import type { FlowNode, ConditionNodeConfig } from '@wa/types';
import type { NodeHandler, NodeExecutionResult, FlowExecutionState } from '../types';

export class ConditionNode implements NodeHandler {
  async execute(
    node: FlowNode,
    state: FlowExecutionState,
  ): Promise<NodeExecutionResult> {
    const config = node.config as ConditionNodeConfig;

    for (const rule of config.rules) {
      try {
        const fn = new Function(...Object.keys(state.context), `return (${rule.expression})`);
        const result = fn(...Object.values(state.context));
        if (result) {
          return { nextNodeId: rule.targetNodeId };
        }
      } catch {
        // Expression evaluation failed — skip this rule
      }
    }

    return { nextNodeId: config.defaultNodeId };
  }
}
