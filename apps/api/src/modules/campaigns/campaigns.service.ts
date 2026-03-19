import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { prisma } from '@wa/database';
import { randomUUID } from 'crypto';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectQueue('campaign-dispatch') private readonly dispatchQueue: Queue,
  ) {}

  list(tenantId: string) {
    return prisma.campaign.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { template: { select: { name: true } } },
    });
  }

  async findOne(tenantId: string, id: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id, tenantId },
      include: { template: true, flow: true, contactList: true },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  create(tenantId: string, data: {
    name: string;
    templateId: string;
    flowId?: string;
    contactListId: string;
    scheduledAt?: Date;
  }) {
    return prisma.campaign.create({ data: { tenantId, ...data } });
  }

  async launch(tenantId: string, id: string) {
    const campaign = await this.findOne(tenantId, id);

    // Get contacts from list
    const items = await prisma.contactListItem.findMany({
      where: { listId: campaign.contactListId },
      include: { contact: true },
    });

    // Create MessageDispatch records in bulk
    await prisma.messageDispatch.createMany({
      data: items.map((item) => ({
        tenantId,
        campaignId: id,
        contactId: item.contactId,
        status: 'PENDING',
      })),
      skipDuplicates: true,
    });

    await prisma.campaign.update({
      where: { id },
      data: { status: 'RUNNING', startedAt: new Date(), totalContacts: items.length },
    });

    // Publish to BullMQ (will fan out to Kafka in Worker)
    const batchId = randomUUID();
    const dispatchIds = items.map((item) => item.contactId);

    await this.dispatchQueue.add('dispatch', {
      campaignId: id,
      tenantId,
      batchId,
      dispatchIds,
    });

    return { launched: true, totalContacts: items.length };
  }

  async pause(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return prisma.campaign.update({ where: { id }, data: { status: 'PAUSED' } });
  }

  async cancel(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return prisma.campaign.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  async getStats(tenantId: string, id: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id, tenantId },
      select: { totalContacts: true, sent: true, delivered: true, read: true, failed: true },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return {
      ...campaign,
      deliveryRate: campaign.sent > 0 ? (campaign.delivered / campaign.sent) * 100 : 0,
      readRate: campaign.delivered > 0 ? (campaign.read / campaign.delivered) * 100 : 0,
    };
  }
}
