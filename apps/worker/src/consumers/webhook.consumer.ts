import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { prisma } from '@wa/database';
import type { BirdWebhookPayload } from '@wa/types';

interface WebhookJob {
  tenantId: string;
  payload: BirdWebhookPayload;
}

@Processor('webhook-processing')
export class WebhookConsumer extends WorkerHost {
  constructor(
    @InjectQueue('flow-execution') private readonly flowQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<WebhookJob>): Promise<void> {
    const { tenantId, payload } = job.data;

    if (payload.type === 'message.status.updated') {
      await this.handleStatusUpdate(tenantId, payload);
    } else if (payload.type === 'message.created' && payload.payload.direction === 'received') {
      await this.handleInboundMessage(tenantId, payload);
    }
  }

  private async handleStatusUpdate(tenantId: string, payload: BirdWebhookPayload) {
    const { id: birdMessageId, status } = payload.payload;
    if (!birdMessageId || !status) return;

    const statusMap: Record<string, string> = {
      delivered: 'DELIVERED',
      read: 'READ',
      failed: 'FAILED',
    };

    const mappedStatus = statusMap[status];
    if (!mappedStatus) return;

    await prisma.messageDispatch.updateMany({
      where: { birdMessageId, tenantId },
      data: {
        status: mappedStatus as any,
        deliveredAt: status === 'delivered' ? new Date() : undefined,
        readAt: status === 'read' ? new Date() : undefined,
        failedAt: status === 'failed' ? new Date() : undefined,
      },
    });

    if (mappedStatus === 'DELIVERED') {
      const dispatch = await prisma.messageDispatch.findFirst({ where: { birdMessageId } });
      if (dispatch) {
        await prisma.campaign.update({
          where: { id: dispatch.campaignId },
          data: { delivered: { increment: 1 } },
        });
      }
    }
  }

  private async handleInboundMessage(tenantId: string, payload: BirdWebhookPayload) {
    const phone = payload.payload.contact?.identifierValue;
    const text = payload.payload.body?.text?.text;
    if (!phone) return;

    // Find or create contact
    const contact = await prisma.contact.upsert({
      where: { tenantId_phone: { tenantId, phone } },
      create: { tenantId, phone },
      update: {},
    });

    // Find open conversation
    const conversation = await prisma.conversation.findFirst({
      where: { tenantId, contactId: contact.id, status: 'OPEN' },
    });

    if (!conversation) return;

    // Store message
    await prisma.message.create({
      data: {
        tenantId,
        conversationId: conversation.id,
        direction: 'INBOUND',
        type: 'TEXT',
        content: { text },
        status: 'DELIVERED',
        receivedAt: new Date(),
      } as any,
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    // Trigger flow execution if conversation has active flow
    if (conversation.activeFlowId && conversation.currentNodeId) {
      await this.flowQueue.add('execute', {
        tenantId,
        conversationId: conversation.id,
        flowId: conversation.activeFlowId,
        currentNodeId: conversation.currentNodeId,
        inboundMessage: text,
      });
    }
  }
}
