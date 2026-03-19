import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { prisma } from '@wa/database';
import { BirdMessagesService } from '@wa/bird-client';
import type { CampaignDispatchEvent } from '@wa/types';

@Processor('campaign-dispatch')
export class CampaignConsumer extends WorkerHost {
  async process(job: Job<CampaignDispatchEvent>): Promise<void> {
    const { campaignId, tenantId } = job.data;

    // Get tenant Bird credentials
    const channel = await prisma.tenantChannel.findFirst({
      where: { tenantId, isActive: true },
    });

    if (!channel) {
      throw new Error(`No active Bird channel for tenant ${tenantId}`);
    }

    // Get campaign with template
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { template: true },
    });

    if (!campaign || !campaign.template.birdTemplateId) {
      throw new Error(`Campaign ${campaignId} or template not found/synced`);
    }

    // Get pending dispatches for this campaign
    const dispatches = await prisma.messageDispatch.findMany({
      where: { campaignId, status: 'PENDING' },
      include: { contact: true },
      take: 100, // Process in batches
    });

    const birdMessages = new BirdMessagesService({
      workspaceId: this.decrypt(channel.birdWorkspaceId),
      apiKey: this.decrypt(channel.birdApiKey),
      channelId: channel.birdChannelId,
    });

    for (const dispatch of dispatches) {
      try {
        const result = await birdMessages.sendTemplate(
          channel.birdChannelId,
          dispatch.contact.phone,
          campaign.template.birdTemplateId!,
          campaign.template.language,
        );

        await prisma.messageDispatch.update({
          where: { id: dispatch.id },
          data: { status: 'SENT', birdMessageId: result.id, sentAt: new Date() },
        });

        await prisma.campaign.update({
          where: { id: campaignId },
          data: { sent: { increment: 1 } },
        });
      } catch (err: any) {
        await prisma.messageDispatch.update({
          where: { id: dispatch.id },
          data: {
            status: err?.isPermanent ? 'FAILED_PERMANENT' : 'FAILED',
            errorCode: String(err?.statusCode ?? 'UNKNOWN'),
            failedAt: new Date(),
          },
        });

        await prisma.campaign.update({
          where: { id: campaignId },
          data: { failed: { increment: 1 } },
        });
      }
    }
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
