import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenantId } from '../../common/decorators/current-tenant.decorator';

@Controller('campaigns')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  list(@CurrentTenantId() tenantId: string) {
    return this.campaignsService.list(tenantId);
  }

  @Get(':id')
  findOne(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.campaignsService.findOne(tenantId, id);
  }

  @Post()
  create(@CurrentTenantId() tenantId: string, @Body() body: any) {
    return this.campaignsService.create(tenantId, body);
  }

  @Post(':id/launch')
  launch(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.campaignsService.launch(tenantId, id);
  }

  @Post(':id/pause')
  pause(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.campaignsService.pause(tenantId, id);
  }

  @Post(':id/cancel')
  cancel(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.campaignsService.cancel(tenantId, id);
  }

  @Get(':id/stats')
  stats(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.campaignsService.getStats(tenantId, id);
  }
}
