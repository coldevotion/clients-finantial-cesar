import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenantId } from '../../common/decorators/current-tenant.decorator';

@Controller('tenants')
@UseGuards(JwtAuthGuard, TenantGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  getMyTenant(@CurrentTenantId() tenantId: string) {
    return this.tenantsService.findById(tenantId);
  }

  @Get('me/channel')
  getChannel(@CurrentTenantId() tenantId: string) {
    return this.tenantsService.getChannel(tenantId);
  }

  @Post('me/channel')
  upsertChannel(
    @CurrentTenantId() tenantId: string,
    @Body()
    body: {
      birdWorkspaceId: string;
      birdApiKey: string;
      birdChannelId: string;
      wabPhoneNumber: string;
    },
  ) {
    return this.tenantsService.upsertChannel(tenantId, body);
  }
}
