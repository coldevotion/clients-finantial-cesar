import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'webhook-processing' }),
    ConversationsModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
