import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@wa/database';

@Injectable()
export class UsersService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
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
      },
    });
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

  // Para el tenant admin: listar usuarios de su tenant
  async listTenantUsers(tenantId: string) {
    return prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true, email: true, name: true, role: true,
        isEmailVerified: true, twoFactorEnabled: true,
        lastLoginAt: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async inviteUser(tenantId: string, data: { email: string; role: string }) {
    // Crear usuario sin contraseña + enviar email de setup
    // TODO: integrar con MailService para enviar invitación
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: '', // se establece en el primer login
        role: data.role as any,
        tenantId,
      },
      select: { id: true, email: true, role: true },
    });
  }
}
