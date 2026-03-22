import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@wa/database';
import * as bcrypt from 'bcrypt';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  tenantId: true,
  avatarUrl: true,
  isEmailVerified: true,
  twoFactorEnabled: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  // ─── Self-service ────────────────────────────────────────────────────────

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: USER_SELECT });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, avatarUrl: true },
    });
  }

  async getActiveSessions(userId: string) {
    return prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, userAgent: true, ipAddress: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await prisma.refreshToken.findFirst({ where: { id: sessionId, userId } });
    if (!session) throw new NotFoundException('Session not found');
    return prisma.refreshToken.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
  }

  // ─── Tenant-level: list team members ─────────────────────────────────────

  async listTenantUsers(tenantId: string) {
    return prisma.user.findMany({
      where: { tenantId },
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── SUPER_ADMIN: list all users (optionally filtered by tenant) ─────────

  async listAllUsers(opts?: { tenantId?: string; search?: string }) {
    return prisma.user.findMany({
      where: {
        ...(opts?.tenantId ? { tenantId: opts.tenantId } : {}),
        ...(opts?.search
          ? {
              OR: [
                { email: { contains: opts.search, mode: 'insensitive' } },
                { name: { contains: opts.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        ...USER_SELECT,
        tenant: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Admin: create user with password ────────────────────────────────────

  async createUser(data: {
    email: string;
    password: string;
    name?: string;
    role: string;
    tenantId?: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException(`Email "${data.email}" already registered`);

    if (!data.password || data.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role as any,
        tenantId: data.tenantId ?? null,
        isEmailVerified: true, // admin-created users are pre-verified
      },
      select: USER_SELECT,
    });
  }

  // ─── Admin: update user ───────────────────────────────────────────────────

  async adminUpdateUser(
    userId: string,
    data: {
      name?: string;
      role?: string;
      tenantId?: string | null;
      password?: string;
    },
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.tenantId !== undefined) updateData.tenantId = data.tenantId;
    if (data.password) {
      if (data.password.length < 8) throw new BadRequestException('Password must be at least 8 characters');
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
    }

    return prisma.user.update({ where: { id: userId }, data: updateData, select: USER_SELECT });
  }

  // ─── Admin: delete user ───────────────────────────────────────────────────

  async adminDeleteUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    await prisma.user.delete({ where: { id: userId } });
    return { ok: true };
  }
}
