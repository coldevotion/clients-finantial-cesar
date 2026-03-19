import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@wa/database';

@Injectable()
export class ConversationsService {
  list(tenantId: string, filters?: { status?: string; page?: number }) {
    return prisma.conversation.findMany({
      where: {
        tenantId,
        ...(filters?.status ? { status: filters.status as any } : {}),
      },
      include: {
        contact: { select: { phone: true, name: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
      skip: ((filters?.page ?? 1) - 1) * 30,
      take: 30,
    });
  }

  async findOne(tenantId: string, id: string) {
    const conv = await prisma.conversation.findFirst({
      where: { id, tenantId },
      include: {
        contact: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  async close(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return prisma.conversation.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date() },
    });
  }

  async findOrCreateForContact(tenantId: string, contactId: string) {
    const existing = await prisma.conversation.findFirst({
      where: { tenantId, contactId, status: 'OPEN' },
    });

    if (existing) return existing;

    return prisma.conversation.create({
      data: { tenantId, contactId },
    });
  }

  async addMessage(conversationId: string, tenantId: string, data: {
    direction: 'INBOUND' | 'OUTBOUND';
    type: string;
    content: object;
    birdMessageId?: string;
  }) {
    const message = await prisma.message.create({
      data: {
        conversationId,
        tenantId,
        direction: data.direction as any,
        type: data.type as any,
        content: data.content,
        birdMessageId: data.birdMessageId,
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }
}
