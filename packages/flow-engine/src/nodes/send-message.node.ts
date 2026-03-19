import type { FlowNode, SendMessageNodeConfig } from '@wa/types';
import type { NodeHandler, NodeExecutionResult, FlowExecutionState, FlowGraph } from '../types';
import { findNextNode } from '../types';

export class SendMessageNode implements NodeHandler {
  constructor(
    private readonly sendText: (tenantId: string, phone: string, text: string) => Promise<void>,
  ) {}

  async execute(
    node: FlowNode,
    state: FlowExecutionState,
    _inboundMessage: string | undefined,
    graph: FlowGraph,
  ): Promise<NodeExecutionResult> {
    const config = node.config as SendMessageNodeConfig;

    const text = interpolate(config.content, state.context);
    await this.sendText(state.tenantId, state.context.contact.phone, text);

    return { nextNodeId: findNextNode(graph, node.id) };
  }
}

function interpolate(template: string, context: Record<string, unknown>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, path: string) => {
    const value = path.trim().split('.').reduce<unknown>((obj, key) => {
      if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[key];
      return undefined;
    }, context as unknown);
    return value != null ? String(value) : '';
  });
}
