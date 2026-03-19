import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenantId } from '../../common/decorators/current-tenant.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard(@CurrentTenantId() tenantId: string) {
    return this.analyticsService.getDashboard(tenantId);
  }

  @Get('campaigns/:id')
  getCampaignStats(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.analyticsService.getCampaignStats(tenantId, id);
  }
}
