import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { BirdWebhookPayload } from '@wa/types';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectQueue('webhook-processing') private readonly webhookQueue: Queue,
  ) {}

  async handleBirdEvent(tenantId: string, payload: BirdWebhookPayload) {
    // Enqueue for async processing in Worker
    await this.webhookQueue.add(payload.type, { tenantId, payload }, { priority: 1 });
  }
}
