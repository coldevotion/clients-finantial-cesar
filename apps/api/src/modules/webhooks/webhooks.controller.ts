import { Controller, Post, Param, Body, Headers, RawBodyRequest, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { WebhooksService } from './webhooks.service';
import { validateBirdWebhookSignature } from '@wa/bird-client';
import type { BirdWebhookPayload } from '@wa/types';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('bird/:tenantId')
  async handleBird(
    @Param('tenantId') tenantId: string,
    @Body() body: BirdWebhookPayload,
    @Headers('x-bird-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const rawBody = req.rawBody;
    const secret = process.env.BIRD_WEBHOOK_SECRET ?? '';

    if (rawBody && signature) {
      const valid = validateBirdWebhookSignature(rawBody, signature, secret);
      if (!valid) throw new UnauthorizedException('Invalid Bird webhook signature');
    }

    await this.webhooksService.handleBirdEvent(tenantId, body);
    return { received: true };
  }
}
