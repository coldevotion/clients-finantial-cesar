import { Controller, Get, Post, Patch, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FlowsService } from './flows.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenantId } from '../../common/decorators/current-tenant.decorator';

@Controller('flows')
@UseGuards(JwtAuthGuard, TenantGuard)
export class FlowsController {
  constructor(private readonly flowsService: FlowsService) {}

  @Get()
  list(@CurrentTenantId() tenantId: string) {
    return this.flowsService.list(tenantId);
  }

  @Get(':id')
  findOne(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.flowsService.findOne(tenantId, id);
  }

  @Post()
  create(@CurrentTenantId() tenantId: string, @Body() body: { name: string; description?: string }) {
    return this.flowsService.create(tenantId, body);
  }

  @Put(':id/graph')
  updateGraph(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: { nodes: any[]; edges: any[] },
  ) {
    return this.flowsService.updateGraph(tenantId, id, body.nodes, body.edges);
  }

  @Post(':id/activate')
  activate(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.flowsService.activate(tenantId, id);
  }

  @Delete(':id')
  remove(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.flowsService.remove(tenantId, id);
  }
}
