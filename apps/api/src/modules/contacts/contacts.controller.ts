import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenantId } from '../../common/decorators/current-tenant.decorator';

@Controller('contacts')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  list(@CurrentTenantId() tenantId: string, @Query('page') page?: string) {
    return this.contactsService.listContacts(tenantId, Number(page ?? 1));
  }

  @Post()
  upsert(@CurrentTenantId() tenantId: string, @Body() body: any) {
    return this.contactsService.upsertContact(tenantId, body);
  }

  @Delete(':id')
  remove(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.contactsService.removeContact(tenantId, id);
  }

  @Get('lists')
  listLists(@CurrentTenantId() tenantId: string) {
    return this.contactsService.listContactLists(tenantId);
  }

  @Post('lists')
  createList(@CurrentTenantId() tenantId: string, @Body() body: { name: string }) {
    return this.contactsService.createContactList(tenantId, body.name);
  }

  @Post('lists/:id/contacts')
  addToList(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: { contactIds: string[] },
  ) {
    return this.contactsService.addContactsToList(tenantId, id, body.contactIds);
  }
}
