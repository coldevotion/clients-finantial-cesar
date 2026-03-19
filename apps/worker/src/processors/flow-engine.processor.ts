import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { prisma } from '@wa/database';
import { FlowEngine } from '@wa/flow-engine';
import type { FlowExecutionState, FlowGraph } from '@wa/flow-engine';
import { BirdMessagesService } from '@wa/bird-client';
import type { FlowNode, FlowEdge } from '@wa/types';

interface FlowExecutionJob {
  tenantId: string;
  conversationId: string;
  flowId: string;
  currentNodeId: string;
  inboundMessage?: string;
}

@Processor('flow-execution')
export class FlowEngineProcessor extends WorkerHost {
  async process(job: Job<FlowExecutionJob>): Promise<void> {
    const { tenantId, conversationId, flowId, currentNodeId, inboundMessage } = job.data;

    const [flow, channel] = await Promise.all([
      prisma.flow.findUnique({ where: { id: flowId } }),
      prisma.tenantChannel.findFirst({ where: { tenantId, isActive: true } }),
    ]);

    if (!flow || !channel) return;

    const graph: FlowGraph = {
      nodes: flow.nodes as unknown as FlowNode[],
      edges: flow.edges as unknown as FlowEdge[],
    };

    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) return;

    const contact = await prisma.contact.findUnique({ where: { id: conversation.contactId } });
    if (!contact) return;

    const state: FlowExecutionState = {
      executionId: `${conversationId}-${Date.now()}`,
      flowId,
      tenantId,
      conversationId,
      currentNodeId,
      status: 'RUNNING',
      context: {
        contact: { phone: contact.phone, name: contact.name ?? undefined, metadata: contact.metadata as any },
        campaign: { id: '', name: '' },
      },
    };

    const birdMessages = new BirdMessagesService({
      workspaceId: this.decrypt(channel.birdWorkspaceId),
      apiKey: this.decrypt(channel.birdApiKey),
      channelId: channel.birdChannelId,
    });

    const engine = new FlowEngine({
      sendText: async (_tenantId, phone, text) => {
        await birdMessages.sendText(channel.birdChannelId, phone, text);
        await prisma.message.create({
          data: {
            tenantId,
            conversationId,
            direction: 'OUTBOUND',
            type: 'TEXT',
            content: { text },
            status: 'SENT',
            sentAt: new Date(),
          } as any,
        });
      },
      onStateUpdate: async (updatedState) => {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            currentNodeId: updatedState.currentNodeId,
            ...(updatedState.status === 'COMPLETED' ? { activeFlowId: null, currentNodeId: null } : {}),
          },
        });
      },
      onDelaySchedule: async (_updatedState, delayMs) => {
        await job.queue.add('execute', job.data, { delay: delayMs });
      },
    });

    await engine.execute(state, graph, inboundMessage);
  }

  private decrypt(value: string): string {
    const { createDecipheriv } = require('crypto');
    const key = Buffer.from(process.env.ENCRYPTION_KEY ?? '', 'hex');
    const buf = Buffer.from(value, 'base64');
    const iv = buf.subarray(0, 16);
    const tag = buf.subarray(16, 32);
    const encrypted = buf.subarray(32);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final('utf8');
  }
}
