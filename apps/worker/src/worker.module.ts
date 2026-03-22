import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { CampaignConsumer } from './consumers/campaign.consumer';
import { WebhookConsumer } from './consumers/webhook.consumer';
import { FlowEngineProcessor } from './processors/flow-engine.processor';
import { BulkUploadProcessor } from './processors/bulk-upload.processor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
    }),
    BullModule.registerQueue(
      { name: 'campaign-dispatch' },
      { name: 'webhook-processing' },
      { name: 'flow-execution' },
      { name: 'bulk-uploads' },
    ),
  ],
  providers: [CampaignConsumer, WebhookConsumer, FlowEngineProcessor, BulkUploadProcessor],
})
export class WorkerModule {}
