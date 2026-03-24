import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@wa/database';
import { hash, compare } from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import type { JwtPayload, AuthTokens } from './jwt.types';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto, ResetPasswordDto, ChangePasswordDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_TTL = 15 * 60;        // 15 min en segundos
const REFRESH_TOKEN_TTL_DAYS = 7;
const TEMP_2FA_TOKEN_TTL = 5 * 60;       // 5 min

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  // ─── REGISTER ──────────────────────────────────────────────────────────────

  private get smtpConfigured(): boolean {
    const host = process.env.SMTP_HOST;
    return !!host && host !== 'localhost';
  }

  async register(dto: RegisterDto, ipAddress?: string) {
    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await hash(dto.password, BCRYPT_ROUNDS);

    // Si trae tenantName, crea tenant nuevo + user como admin
    let tenantId: string | null = null;
    if (dto.tenantName) {
      const slug = this.slugify(dto.tenantName);
      const tenant = await prisma.tenant.create({
        data: { name: dto.tenantName, slug },
      });
      tenantId = tenant.id;
    }

    // Si no hay SMTP configurado, auto-verificar el email
    const isEmailVerified = !this.smtpConfigured;

    const user = await prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        tenantId,
        role: tenantId ? 'TENANT_ADMIN' : 'TENANT_OPERATOR',
        isEmailVerified,
      },
    });

    if (this.smtpConfigured) {
      await this.sendVerificationEmail(user.id, user.email);
      return { message: 'Registration successful. Check your email to verify your account.' };
    }

    return { message: 'Registration successful.' };
  }

  // ─── LOGIN ─────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email not verified. Check your inbox.');
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    // Si tiene 2FA activo → devolver token temporal
    if (user.twoFactorEnabled) {
      const tempToken = this.signTempToken(user);
      return { requires2fa: true, tempToken };
    }

    return this.issueTokens(user, userAgent, ipAddress);
  }

  // ─── 2FA VERIFY (durante login) ────────────────────────────────────────────

  async verify2faLogin(tempToken: string, totpCode: string, userAgent?: string, ipAddress?: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify(tempToken, {
        secret: this.config.get('jwt.secret'),
      }) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired temporary token');
    }

    if (payload.scope !== 'pending_2fa') {
      throw new UnauthorizedException('Invalid token scope');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user?.twoFactorSecret) throw new UnauthorizedException('2FA not configured');

    const secret = this.decryptSecret(user.twoFactorSecret);
    const isValid = authenticator.verify({ token: totpCode, secret });

    if (!isValid) throw new UnauthorizedException('Invalid 2FA code');

    return this.issueTokens(user, userAgent, ipAddress);
  }

  // ─── REFRESH TOKEN ─────────────────────────────────────────────────────────

  async refreshTokens(rawRefreshToken: string, userAgent?: string, ipAddress?: string) {
    const tokenHash = this.hashToken(rawRefreshToken);

    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate: revocar el anterior y emitir nuevo
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw new UnauthorizedException('User not found');

    return this.issueTokens(user, userAgent, ipAddress);
  }

  // ─── LOGOUT ────────────────────────────────────────────────────────────────

  async logout(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logged out' };
  }

  async logoutAll(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'All sessions terminated' };
  }

  // ─── EMAIL VERIFICATION ────────────────────────────────────────────────────

  async verifyEmail(token: string) {
    const tokenHash = this.hashToken(token);
    const record = await prisma.emailVerification.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification link');
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { isEmailVerified: true } }),
      prisma.emailVerification.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);

    return { message: 'Email verified successfully' };
  }

  async resendVerification(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.isEmailVerified) return { message: 'If that email exists, a verification link was sent.' };
    await this.sendVerificationEmail(user.id, user.email);
    return { message: 'Verification email sent' };
  }

  // ─── PASSWORD RESET ────────────────────────────────────────────────────────

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always return same message to avoid user enumeration
    if (!user) return { message: 'If that email exists, a reset link was sent.' };

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hora
      },
    });

    await this.mail.sendPasswordReset(user.email, user.name ?? user.email, rawToken);
    return { message: 'If that email exists, a reset link was sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token);
    const record = await prisma.passwordReset.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset link');
    }

    const passwordHash = await hash(dto.newPassword, BCRYPT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordReset.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      // Revocar todos los refresh tokens al cambiar contraseña
      prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Password updated successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (!(await compare(dto.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await hash(dto.newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    return { message: 'Password changed successfully' };
  }

  // ─── 2FA SETUP ─────────────────────────────────────────────────────────────

  async setup2fa(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.twoFactorEnabled) throw new BadRequestException('2FA is already enabled');

    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(user.email, 'WA Campaigns', secret);
    const qrCodeDataUrl = await toDataURL(otpAuthUrl);

    // Guardar el secreto temporalmente (cifrado) — no activo hasta que confirme
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: this.encryptSecret(secret) },
    });

    return { secret, qrCodeDataUrl };
  }

  async confirm2fa(userId: string, totpCode: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) throw new BadRequestException('2FA setup not initiated');
    if (user.twoFactorEnabled) throw new BadRequestException('2FA already enabled');

    const secret = this.decryptSecret(user.twoFactorSecret);
    const isValid = authenticator.verify({ token: totpCode, secret });

    if (!isValid) throw new UnauthorizedException('Invalid TOTP code');

    // Generar backup codes
    const backupCodes = Array.from({ length: 8 }, () => randomBytes(4).toString('hex').toUpperCase());
    const backupCodesHashed = await Promise.all(backupCodes.map((c) => hash(c, 10)));

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true, twoFactorBackupCodes: backupCodesHashed },
    });

    // Devolver los códigos en texto plano SOLO esta vez
    return { message: '2FA enabled', backupCodes };
  }

  async disable2fa(userId: string, totpCode: string, password: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.twoFactorEnabled) throw new BadRequestException('2FA is not enabled');

    if (!(await compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Incorrect password');
    }

    const secret = this.decryptSecret(user.twoFactorSecret!);
    const isValid = authenticator.verify({ token: totpCode, secret });
    if (!isValid) throw new UnauthorizedException('Invalid TOTP code');

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: [] },
    });

    return { message: '2FA disabled' };
  }

  async useBackupCode(userId: string, code: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorEnabled) throw new BadRequestException('2FA not enabled');

    for (let i = 0; i < user.twoFactorBackupCodes.length; i++) {
      const match = await compare(code.toUpperCase(), user.twoFactorBackupCodes[i]);
      if (match) {
        // Eliminar el código usado
        const remaining = [...user.twoFactorBackupCodes];
        remaining.splice(i, 1);
        await prisma.user.update({ where: { id: userId }, data: { twoFactorBackupCodes: remaining } });
        return true;
      }
    }
    throw new UnauthorizedException('Invalid backup code');
  }

  // ─── HELPERS PRIVADOS ──────────────────────────────────────────────────────

  private async issueTokens(
    user: { id: string; email: string; tenantId: string | null; role: string },
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthTokens & { user: object }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      scope: 'full',
    };

    const accessToken = this.jwt.sign(payload, { expiresIn: ACCESS_TOKEN_TTL });

    // Refresh token: valor aleatorio, guardado hasheado en DB
    const rawRefreshToken = randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    await prisma.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt, userAgent, ipAddress },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: ACCESS_TOKEN_TTL,
      user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
    };
  }

  private signTempToken(user: { id: string; email: string; tenantId: string | null; role: string }) {
    return this.jwt.sign(
      { sub: user.id, email: user.email, tenantId: user.tenantId, role: user.role, scope: 'pending_2fa' },
      { expiresIn: TEMP_2FA_TOKEN_TTL },
    );
  }

  private async sendVerificationEmail(userId: string, email: string) {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    await prisma.emailVerification.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });

    await this.mail.sendEmailVerification(email, rawToken);
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private encryptSecret(secret: string): string {
    const rawKey = process.env.ENCRYPTION_KEY ?? '';
    if (rawKey.length !== 64) throw new BadRequestException('2FA requires ENCRYPTION_KEY to be configured (openssl rand -hex 32)');
    const { createCipheriv, randomBytes: rb } = require('crypto');
    const key = Buffer.from(rawKey, 'hex');
    const iv = rb(16);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  private decryptSecret(value: string): string {
    const rawKey = process.env.ENCRYPTION_KEY ?? '';
    if (rawKey.length !== 64) throw new BadRequestException('2FA requires ENCRYPTION_KEY to be configured (openssl rand -hex 32)');
    const { createDecipheriv } = require('crypto');
    const key = Buffer.from(rawKey, 'hex');
    const buf = Buffer.from(value, 'base64');
    const iv = buf.subarray(0, 16);
    const tag = buf.subarray(16, 32);
    const encrypted = buf.subarray(32);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final('utf8');
  }

  private slugify(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
}
