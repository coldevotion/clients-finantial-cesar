import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenantId } from '../../common/decorators/current-tenant.decorator';

@Controller('templates')
@UseGuards(JwtAuthGuard, TenantGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  list(@CurrentTenantId() tenantId: string) {
    return this.templatesService.list(tenantId);
  }

  @Get(':id')
  findOne(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.templatesService.findOne(tenantId, id);
  }

  @Post()
  create(@CurrentTenantId() tenantId: string, @Body() body: any) {
    return this.templatesService.create(tenantId, body);
  }

  @Patch(':id')
  update(@CurrentTenantId() tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.templatesService.update(tenantId, id, body);
  }

  @Delete(':id')
  remove(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.templatesService.remove(tenantId, id);
  }

  @Post(':id/sync')
  sync(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.templatesService.syncWithBird(tenantId, id);
  }
}
