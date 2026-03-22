import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma } from '@wa/database';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export interface CreateTenantDto {
  name: string;
  slug: string;
  plan?: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  document?: string;
  email?: string;
  phone?: string;
  notes?: string;
  contactLimit?: number;
  omitActive?: boolean;
}

export interface UpdateTenantDto {
  name?: string;
  plan?: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  status?: 'ACTIVE' | 'SUSPENDED';
  document?: string;
  email?: string;
  phone?: string;
  notes?: string;
  contactLimit?: number;
  omitActive?: boolean;
}

@Injectable()
export class TenantsService {
  // ─── Admin: list all tenants ────────────────────────────────────────────────

  async findAll(opts?: { search?: string; status?: string }) {
    return prisma.tenant.findMany({
      where: {
        ...(opts?.status ? { status: opts.status as any } : {}),
        ...(opts?.search
          ? {
              OR: [
                { name: { contains: opts.search, mode: 'insensitive' } },
                { slug: { contains: opts.search, mode: 'insensitive' } },
                { email: { contains: opts.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        _count: { select: { users: true, campaigns: true, contacts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Get single tenant ────────────────────────────────────────────────────

  async findById(id: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, campaigns: true, contacts: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  // ─── Admin: create tenant (cliente) ─────────────────────────────────────────

  async create(data: CreateTenantDto) {
    const existing = await prisma.tenant.findUnique({ where: { slug: data.slug } });
    if (existing) throw new ConflictException(`Slug "${data.slug}" already taken`);

    return prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        plan: data.plan ?? 'STARTER',
        document: data.document,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
        contactLimit: data.contactLimit ?? 1000,
        omitActive: data.omitActive ?? true,
      },
    });
  }

  // ─── Admin: update tenant ────────────────────────────────────────────────

  async update(id: string, data: UpdateTenantDto) {
    await this.findById(id);
    return prisma.tenant.update({ where: { id }, data });
  }

  // ─── Admin: suspend / activate ───────────────────────────────────────────

  async setStatus(id: string, status: 'ACTIVE' | 'SUSPENDED') {
    await this.findById(id);
    return prisma.tenant.update({ where: { id }, data: { status } });
  }

  // ─── Admin: delete tenant ────────────────────────────────────────────────

  async remove(id: string) {
    await this.findById(id);
    await prisma.tenant.delete({ where: { id } });
    return { ok: true };
  }

  // ─── Tenant self: get own info ────────────────────────────────────────────

  async getMyTenant(tenantId: string) {
    return this.findById(tenantId);
  }

  // ─── Channel management (encrypted) ──────────────────────────────────────

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
    const existing = await prisma.tenantChannel.findFirst({ where: { tenantId } });
    if (existing) {
      return prisma.tenantChannel.update({
        where: { id: existing.id },
        data: {
          birdWorkspaceId: this.encrypt(data.birdWorkspaceId),
          birdApiKey: this.encrypt(data.birdApiKey),
          birdChannelId: data.birdChannelId,
          wabPhoneNumber: data.wabPhoneNumber,
        },
      });
    }
    return prisma.tenantChannel.create({
      data: {
        tenantId,
        birdWorkspaceId: this.encrypt(data.birdWorkspaceId),
        birdApiKey: this.encrypt(data.birdApiKey),
        birdChannelId: data.birdChannelId,
        wabPhoneNumber: data.wabPhoneNumber,
      },
    });
  }

  // ─── Crypto helpers ───────────────────────────────────────────────────────

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
