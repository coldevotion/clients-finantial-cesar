import { Controller, Post, Param, Body } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import type { BirdWebhookPayload } from '@wa/types';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('bird/:tenantId')
  async handleBird(
    @Param('tenantId') tenantId: string,
    @Body() body: BirdWebhookPayload,
  ) {
    await this.webhooksService.handleBirdEvent(tenantId, body);
    return { received: true };
  }
}
