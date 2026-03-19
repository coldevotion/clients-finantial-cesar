import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenantId } from '../../common/decorators/current-tenant.decorator';

@Controller('conversations')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  list(@CurrentTenantId() tenantId: string, @Query() query: any) {
    return this.conversationsService.list(tenantId, query);
  }

  @Get(':id')
  findOne(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.conversationsService.findOne(tenantId, id);
  }

  @Post(':id/close')
  close(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.conversationsService.close(tenantId, id);
  }
}
