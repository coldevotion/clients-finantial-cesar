import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, ForbiddenException,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
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

@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // ─── SUPER_ADMIN: admin CRUD ─────────────────────────────────────────────

  /** GET /tenants — list all clients (SUPER_ADMIN only) */
  @Get()
  listAll(
    @CurrentUser() user: AuthUser,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    requireSuperAdmin(user);
    return this.tenantsService.findAll({ search, status });
  }

  /** GET /tenants/:id — get one client (SUPER_ADMIN only) */
  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    requireSuperAdmin(user);
    return this.tenantsService.findById(id);
  }

  /** POST /tenants — create a client (SUPER_ADMIN only) */
  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      name: string;
      slug: string;
      plan?: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
      document?: string;
      email?: string;
      phone?: string;
      notes?: string;
      moduleIds?: string[];
      isLimit?: boolean;
      contactLimit?: number;
      omitActive?: boolean;
    },
  ) {
    requireSuperAdmin(user);
    return this.tenantsService.create(body);
  }

  /** PATCH /tenants/:id — update a client (SUPER_ADMIN only) */
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      plan?: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
      status?: 'ACTIVE' | 'SUSPENDED';
      document?: string;
      email?: string;
      phone?: string;
      notes?: string;
      moduleIds?: string[];
      isLimit?: boolean;
      contactLimit?: number;
      omitActive?: boolean;
    },
  ) {
    requireSuperAdmin(user);
    return this.tenantsService.update(id, body);
  }

  /** DELETE /tenants/:id — delete a client (SUPER_ADMIN only) */
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    requireSuperAdmin(user);
    return this.tenantsService.remove(id);
  }

  // ─── TENANT self-service endpoints ───────────────────────────────────────

  /** GET /tenants/me — own tenant info */
  @Get('me')
  getMyTenant(@CurrentUser() user: AuthUser) {
    if (!user.tenantId) throw new ForbiddenException('No tenant assigned');
    return this.tenantsService.getMyTenant(user.tenantId);
  }

  /** GET /tenants/me/channel — channel config */
  @Get('me/channel')
  getChannel(@CurrentUser() user: AuthUser) {
    if (!user.tenantId) throw new ForbiddenException('No tenant assigned');
    return this.tenantsService.getChannel(user.tenantId);
  }

  /** POST /tenants/me/channel — upsert channel config (TENANT_ADMIN or SUPER_ADMIN) */
  @Post('me/channel')
  upsertChannel(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      birdWorkspaceId: string;
      birdApiKey: string;
      birdChannelId: string;
      wabPhoneNumber: string;
    },
  ) {
    requireAdmin(user);
    if (!user.tenantId) throw new ForbiddenException('No tenant assigned');
    return this.tenantsService.upsertChannel(user.tenantId, body);
  }
}
