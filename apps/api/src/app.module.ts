import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { BullModule } from '@nestjs/bullmq';
import envConfig from './config/env.config';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { FlowsModule } from './modules/flows/flows.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [envConfig] }),
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
    }),
    AuthModule,
    UsersModule,
    TenantsModule,
    TemplatesModule,
    FlowsModule,
    CampaignsModule,
    ContactsModule,
    ConversationsModule,
    WebhooksModule,
    AnalyticsModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'auth/(.*)', method: RequestMethod.ALL },
        { path: 'webhooks/(.*)', method: RequestMethod.ALL },
        { path: 'api/health', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
