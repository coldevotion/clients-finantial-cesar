import { NodeType } from '@wa/types';
import type { FlowNode } from '@wa/types';
import type { FlowExecutionState, FlowGraph, NodeHandler } from './types';
import { findNode } from './types';
import { SendMessageNode } from './nodes/send-message.node';
import { WaitResponseNode } from './nodes/wait-response.node';
import { ConditionNode } from './nodes/condition.node';
import { DelayNode } from './nodes/delay.node';
import { EndNode } from './nodes/end.node';

export interface FlowEngineOptions {
  sendText: (tenantId: string, phone: string, text: string) => Promise<void>;
  onStateUpdate: (state: FlowExecutionState) => Promise<void>;
  onDelaySchedule: (state: FlowExecutionState, delayMs: number) => Promise<void>;
}

export class FlowEngine {
  private readonly handlers: Partial<Record<NodeType, NodeHandler>>;

  constructor(private readonly opts: FlowEngineOptions) {
    this.handlers = {
      [NodeType.SEND_MESSAGE]: new SendMessageNode(opts.sendText),
      [NodeType.WAIT_RESPONSE]: new WaitResponseNode(),
      [NodeType.CONDITION]: new ConditionNode(),
      [NodeType.DELAY]: new DelayNode(),
      [NodeType.END]: new EndNode(),
    };
  }

  async execute(
    state: FlowExecutionState,
    graph: FlowGraph,
    inboundMessage?: string,
  ): Promise<void> {
    let current: FlowNode | undefined = findNode(graph, state.currentNodeId);

    while (current) {
      const handler = this.handlers[current.type as NodeType];
      if (!handler) throw new Error(`No handler for node type: ${current.type}`);

      const result = await (handler as any).execute(current, state, inboundMessage, graph);

      // Merge updated context
      if (result.updatedContext) {
        state.context = { ...state.context, ...result.updatedContext };
      }

      if (result.waitForResponse) {
        state.status = 'WAITING';
        await this.opts.onStateUpdate(state);
        return;
      }

      if (result.delayMs && result.nextNodeId) {
        state.currentNodeId = result.nextNodeId;
        state.status = 'WAITING';
        await this.opts.onStateUpdate(state);
        await this.opts.onDelaySchedule(state, result.delayMs);
        return;
      }

      if (!result.nextNodeId) {
        state.status = 'COMPLETED';
        await this.opts.onStateUpdate(state);
        return;
      }

      state.currentNodeId = result.nextNodeId;
      current = findNode(graph, result.nextNodeId);

      // Inbound message only applies to the first wait_response node
      inboundMessage = undefined;
    }

    state.status = 'COMPLETED';
    await this.opts.onStateUpdate(state);
  }
}
