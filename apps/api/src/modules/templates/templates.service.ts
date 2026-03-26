import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@wa/database';

@Injectable()
export class TemplatesService {
  constructor() {}

  list(tenantId: string) {
    return prisma.template.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const template = await prisma.template.findFirst({ where: { id, tenantId } });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  create(tenantId: string, data: {
    name: string;
    category: string;
    language: string;
    components: unknown;
    variables?: unknown;
  }) {
    return prisma.template.create({
      data: { tenantId, ...data, components: data.components as any, variables: (data.variables ?? []) as any },
    });
  }

  async update(tenantId: string, id: string, data: Partial<{ name: string; components: unknown }>) {
    await this.findOne(tenantId, id);
    return prisma.template.update({ where: { id }, data: data as any });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return prisma.template.delete({ where: { id } });
  }

}
