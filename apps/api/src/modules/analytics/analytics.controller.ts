import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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

  // ─── HSM Send Report ──────────────────────────────────────────────────────

  @Get('reports/hsm')
  getHsmReport(
    @CurrentTenantId() tenantId: string,
    @Query('templateId') templateId?: string,
    @Query('phone') phone?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getHsmReport(tenantId, {
      templateId,
      phone,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
  }

  // ─── Conversation Report ──────────────────────────────────────────────────

  @Get('reports/conversations')
  getConversationReport(
    @CurrentTenantId() tenantId: string,
    @Query('phone') phone?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getConversationReport(tenantId, {
      phone,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
  }

  // ─── Template Summary ──────────────────────────────────────────────────────

  @Get('reports/summary')
  getSummary(
    @CurrentTenantId() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getTemplateSummary(
      tenantId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  // ─── Admin-only ────────────────────────────────────────────────────────────

  @Get('admin/stats')
  getAdminStats() {
    return this.analyticsService.getAdminStats();
  }

  @Get('admin/logs')
  getAdminLogs(
    @Query('level') level?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getAdminLogs({
      level,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 100,
    });
  }
}
