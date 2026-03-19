import {
  Controller, Post, Get, Body, Param, UseGuards, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, type AuthUser } from './decorators/current-user.decorator';
import {
  LoginDto, Verify2faDto, RefreshTokenDto,
  ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto,
} from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // ─── Registro ──────────────────────────────────────────────────────────────

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  // ─── Login ─────────────────────────────────────────────────────────────────

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto, req.headers['user-agent'], req.ip);
  }

  // ─── 2FA durante login ─────────────────────────────────────────────────────

  @Post('2fa/verify-login')
  @HttpCode(HttpStatus.OK)
  verify2faLogin(@Body() dto: Verify2faDto, @Req() req: Request) {
    return this.auth.verify2faLogin(dto.tempToken, dto.totpCode, req.headers['user-agent'], req.ip);
  }

  // ─── Refresh Token ─────────────────────────────────────────────────────────

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.auth.refreshTokens(dto.refreshToken, req.headers['user-agent'], req.ip);
  }

  // ─── Logout ────────────────────────────────────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: RefreshTokenDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logoutAll(@CurrentUser() user: AuthUser) {
    return this.auth.logoutAll(user.id);
  }

  // ─── Verificación de email ─────────────────────────────────────────────────

  @Get('verify-email/:token')
  verifyEmail(@Param('token') token: string) {
    return this.auth.verifyEmail(token);
  }

  @Post('resend-verification')
  resendVerification(@Body() body: { email: string }) {
    return this.auth.resendVerification(body.email);
  }

  // ─── Reset de contraseña ───────────────────────────────────────────────────

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user.id, dto);
  }

  // ─── 2FA Setup (requiere estar autenticado) ────────────────────────────────

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  setup2fa(@CurrentUser() user: AuthUser) {
    return this.auth.setup2fa(user.id);
  }

  @Post('2fa/confirm')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  confirm2fa(@CurrentUser() user: AuthUser, @Body() body: { totpCode: string }) {
    return this.auth.confirm2fa(user.id, body.totpCode);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  disable2fa(
    @CurrentUser() user: AuthUser,
    @Body() body: { totpCode: string; password: string },
  ) {
    return this.auth.disable2fa(user.id, body.totpCode, body.password);
  }

  @Post('2fa/backup-code')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  useBackupCode(@CurrentUser() user: AuthUser, @Body() body: { code: string }) {
    return this.auth.useBackupCode(user.id, body.code);
  }

  // ─── Me ────────────────────────────────────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
