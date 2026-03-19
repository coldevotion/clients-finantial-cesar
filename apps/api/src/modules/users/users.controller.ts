import { Controller, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser() user: AuthUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: AuthUser, @Body() body: { name?: string; avatarUrl?: string }) {
    return this.usersService.updateProfile(user.id, body);
  }

  @Get('me/sessions')
  getSessions(@CurrentUser() user: AuthUser) {
    return this.usersService.getActiveSessions(user.id);
  }

  @Delete('me/sessions/:sessionId')
  revokeSession(@CurrentUser() user: AuthUser, @Param('sessionId') sessionId: string) {
    return this.usersService.revokeSession(user.id, sessionId);
  }

  // Tenant admin: gestión de usuarios del tenant
  @Get('team')
  listTeam(@CurrentUser() user: AuthUser) {
    if (!user.tenantId) return [];
    return this.usersService.listTenantUsers(user.tenantId);
  }
}
