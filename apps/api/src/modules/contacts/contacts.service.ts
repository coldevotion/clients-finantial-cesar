import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@wa/database';

@Injectable()
export class ContactsService {
  listContacts(tenantId: string, page = 1, limit = 50) {
    return prisma.contact.findMany({
      where: { tenantId, optedOut: false },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  upsertContact(tenantId: string, data: { phone: string; name?: string; metadata?: object }) {
    return prisma.contact.upsert({
      where: { tenantId_phone: { tenantId, phone: data.phone } },
      create: { tenantId, ...data },
      update: { name: data.name, metadata: data.metadata as any },
    });
  }

  async removeContact(tenantId: string, id: string) {
    const contact = await prisma.contact.findFirst({ where: { id, tenantId } });
    if (!contact) throw new NotFoundException('Contact not found');
    return prisma.contact.delete({ where: { id } });
  }

  listContactLists(tenantId: string) {
    return prisma.contactList.findMany({
      where: { tenantId },
      include: { _count: { select: { contacts: true } } },
    });
  }

  createContactList(tenantId: string, name: string) {
    return prisma.contactList.create({ data: { tenantId, name } });
  }

  async addContactsToList(tenantId: string, listId: string, contactIds: string[]) {
    const list = await prisma.contactList.findFirst({ where: { id: listId, tenantId } });
    if (!list) throw new NotFoundException('Contact list not found');

    return prisma.contactListItem.createMany({
      data: contactIds.map((contactId) => ({ listId, contactId })),
      skipDuplicates: true,
    });
  }
}
