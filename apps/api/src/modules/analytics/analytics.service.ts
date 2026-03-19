import { Injectable } from '@nestjs/common';
import { prisma } from '@wa/database';

@Injectable()
export class AnalyticsService {
  async getDashboard(tenantId: string) {
    const [campaigns, conversations, totalContacts] = await Promise.all([
      prisma.campaign.aggregate({
        where: { tenantId },
        _count: { id: true },
        _sum: { sent: true, delivered: true, read: true, failed: true },
      }),
      prisma.conversation.count({ where: { tenantId, status: 'OPEN' } }),
      prisma.contact.count({ where: { tenantId, optedOut: false } }),
    ]);

    return {
      totalCampaigns: campaigns._count.id,
      totalSent: campaigns._sum.sent ?? 0,
      totalDelivered: campaigns._sum.delivered ?? 0,
      totalRead: campaigns._sum.read ?? 0,
      totalFailed: campaigns._sum.failed ?? 0,
      openConversations: conversations,
      totalContacts,
    };
  }

  getCampaignStats(tenantId: string, campaignId: string) {
    return prisma.campaign.findFirst({
      where: { id: campaignId, tenantId },
      select: { totalContacts: true, sent: true, delivered: true, read: true, failed: true, status: true },
    });
  }
}
