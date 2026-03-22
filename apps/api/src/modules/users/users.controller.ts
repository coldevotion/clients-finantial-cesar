import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';

function requireSuperAdmin(user: AuthUser) {
  if (user.role !== 'SUPER_ADMIN') throw new ForbiddenException('SUPER_ADMIN only');
}

function requireAdmin(user: AuthUser) {
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'TENANT_ADMIN') {
    throw new ForbiddenException('Admin only');
  }
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── Self-service ────────────────────────────────────────────────────────

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

  // ─── Tenant admin: team management ───────────────────────────────────────

  /** GET /users/team — users in own tenant (TENANT_ADMIN) */
  @Get('team')
  listTeam(@CurrentUser() user: AuthUser) {
    requireAdmin(user);
    if (!user.tenantId) return [];
    return this.usersService.listTenantUsers(user.tenantId);
  }

  // ─── SUPER_ADMIN: global user management ─────────────────────────────────

  /**
   * GET /users
   * SUPER_ADMIN → all users, optionally filtered by ?tenantId= or ?search=
   */
  @Get()
  listAll(
    @CurrentUser() user: AuthUser,
    @Query('tenantId') tenantId?: string,
    @Query('search') search?: string,
  ) {
    requireSuperAdmin(user);
    return this.usersService.listAllUsers({ tenantId, search });
  }

  /**
   * POST /users — create a user and assign to a tenant
   * SUPER_ADMIN can create any user in any tenant.
   * TENANT_ADMIN can only create users in their own tenant.
   */
  @Post()
  createUser(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      email: string;
      password: string;
      name?: string;
      role: string;
      tenantId?: string;
    },
  ) {
    requireAdmin(user);

    // TENANT_ADMIN can only create users in their own tenant
    if (user.role === 'TENANT_ADMIN') {
      body.tenantId = user.tenantId ?? undefined;
      // TENANT_ADMIN cannot create SUPER_ADMIN users
      if (body.role === 'SUPER_ADMIN') throw new ForbiddenException('Cannot assign SUPER_ADMIN role');
    }

    return this.usersService.createUser(body);
  }

  /** PATCH /users/:id — update any user (SUPER_ADMIN) */
  @Patch(':id')
  updateUser(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      role?: string;
      tenantId?: string | null;
      password?: string;
    },
  ) {
    requireAdmin(user);

    // TENANT_ADMIN restrictions
    if (user.role === 'TENANT_ADMIN') {
      delete body.tenantId; // cannot move users between tenants
      if (body.role === 'SUPER_ADMIN') throw new ForbiddenException('Cannot assign SUPER_ADMIN role');
    }

    return this.usersService.adminUpdateUser(id, body);
  }

  /** DELETE /users/:id — delete a user (SUPER_ADMIN only) */
  @Delete(':id')
  deleteUser(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    requireSuperAdmin(user);
    return this.usersService.adminDeleteUser(id);
  }
}
