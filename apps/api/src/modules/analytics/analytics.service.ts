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

  // ─── HSM Send Reports ──────────────────────────────────────────────────────

  async getHsmReport(tenantId: string, filters: {
    templateId?: string;
    phone?: string;
    from?: Date;
    to?: Date;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { templateId, phone, from, to, status, page = 1, limit = 50 } = filters;

    const where: any = { tenantId };
    if (status) where.status = status;
    if (from || to) where.createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };

    // Join through campaign → template filter
    if (templateId) where.campaign = { templateId };

    // Phone filter requires joining through contact
    if (phone) where.contact = { phone: { contains: phone } };

    const [rows, total] = await Promise.all([
      prisma.messageDispatch.findMany({
        where,
        include: {
          contact: { select: { name: true, phone: true } },
          campaign: { select: { name: true, template: { select: { id: true, name: true, category: true } } } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.messageDispatch.count({ where }),
    ]);

    return { data: rows, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ─── Conversation Detail Report ────────────────────────────────────────────

  async getConversationReport(tenantId: string, filters: {
    phone?: string;
    from?: Date;
    to?: Date;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { phone, from, to, status, page = 1, limit = 50 } = filters;

    const where: any = { tenantId };
    if (status) where.status = status;
    if (from || to) where.startedAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
    if (phone) where.contact = { phone: { contains: phone } };

    const [rows, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          contact: { select: { name: true, phone: true } },
          messages: {
            orderBy: { createdAt: 'asc' },
            select: { direction: true, type: true, content: true, status: true, sentAt: true, createdAt: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startedAt: 'desc' },
      }),
      prisma.conversation.count({ where }),
    ]);

    return { data: rows, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ─── Admin Reports ──────────────────────────────────────────────────────────

  async getAdminStats() {
    const [tenants, users, totalSent, totalFailed, activeCampaigns] = await Promise.all([
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count(),
      prisma.campaign.aggregate({ _sum: { sent: true } }),
      prisma.campaign.aggregate({ _sum: { failed: true } }),
      prisma.campaign.count({ where: { status: 'RUNNING' } }),
    ]);

    return {
      activeClients: tenants,
      activeUsers: users,
      totalMessagesSent: totalSent._sum.sent ?? 0,
      totalMessagesFailed: totalFailed._sum.failed ?? 0,
      activeCampaigns,
    };
  }

  async getAdminLogs(filters: { level?: string; from?: Date; to?: Date; page?: number; limit?: number }) {
    const { level, from, to, page = 1, limit = 100 } = filters;

    const where: any = {};
    if (level) where.level = level;
    if (from || to) where.createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };

    const [rows, total] = await Promise.all([
      prisma.log.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.log.count({ where }),
    ]);

    return { data: rows, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ─── Summary by template ───────────────────────────────────────────────────

  async getTemplateSummary(tenantId: string, from?: Date, to?: Date) {
    const dispatches = await prisma.messageDispatch.groupBy({
      by: ['status'],
      where: {
        tenantId,
        ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      },
      _count: { id: true },
    });

    const campaigns = await prisma.campaign.findMany({
      where: {
        tenantId,
        ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      },
      include: { template: { select: { id: true, name: true, category: true } } },
    });

    // Group by template
    const byTemplate: Record<string, any> = {};
    for (const c of campaigns) {
      const key = c.templateId;
      if (!byTemplate[key]) {
        byTemplate[key] = {
          templateId: key,
          templateName: c.template.name,
          category: c.template.category,
          sent: 0, delivered: 0, read: 0, failed: 0, campaigns: 0,
        };
      }
      byTemplate[key].sent += c.sent;
      byTemplate[key].delivered += c.delivered;
      byTemplate[key].read += c.read;
      byTemplate[key].failed += c.failed;
      byTemplate[key].campaigns += 1;
    }

    return {
      byStatus: dispatches.map(d => ({ status: d.status, count: d._count.id })),
      byTemplate: Object.values(byTemplate),
    };
  }
}
