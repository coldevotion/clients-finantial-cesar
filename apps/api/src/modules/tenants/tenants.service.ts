import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@wa/database';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

@Injectable()
export class TenantsService {
  async findById(id: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async create(data: { name: string; slug: string }) {
    return prisma.tenant.create({ data });
  }

  async getChannel(tenantId: string) {
    const channel = await prisma.tenantChannel.findFirst({
      where: { tenantId, isActive: true },
    });
    if (!channel) throw new NotFoundException('No active Bird channel for this tenant');

    return {
      ...channel,
      birdWorkspaceId: this.decrypt(channel.birdWorkspaceId),
      birdApiKey: this.decrypt(channel.birdApiKey),
    };
  }

  async upsertChannel(
    tenantId: string,
    data: {
      birdWorkspaceId: string;
      birdApiKey: string;
      birdChannelId: string;
      wabPhoneNumber: string;
    },
  ) {
    return prisma.tenantChannel.upsert({
      where: { id: tenantId },
      create: {
        tenantId,
        birdWorkspaceId: this.encrypt(data.birdWorkspaceId),
        birdApiKey: this.encrypt(data.birdApiKey),
        birdChannelId: data.birdChannelId,
        wabPhoneNumber: data.wabPhoneNumber,
      },
      update: {
        birdWorkspaceId: this.encrypt(data.birdWorkspaceId),
        birdApiKey: this.encrypt(data.birdApiKey),
        birdChannelId: data.birdChannelId,
        wabPhoneNumber: data.wabPhoneNumber,
      },
    });
  }

  private encrypt(value: string): string {
    const key = Buffer.from(process.env.ENCRYPTION_KEY ?? '', 'hex');
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  private decrypt(value: string): string {
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
