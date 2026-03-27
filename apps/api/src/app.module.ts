import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
import { LogsModule } from './modules/logs/logs.module';
import { BulkUploadsModule } from './modules/bulk-uploads/bulk-uploads.module';
import { CryptoModule } from './modules/crypto/crypto.module';
import { CryptoMiddleware } from './modules/crypto/crypto.middleware';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      envFilePath: ['../../.env', '.env'],
    }),
    // Rate limiting: 300 requests per 60s per IP
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get<string>('redis.url') },
      }),
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
    LogsModule,
    BulkUploadsModule,
    CryptoModule,
  ],
  providers: [
    // Apply ThrottlerGuard globally
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // CryptoMiddleware: descifra req.body en todas las rutas que envíen X-Client-Key
    consumer
      .apply(CryptoMiddleware)
      .forRoutes('*');

    // TenantMiddleware: valida JWT + extrae tenantId/userId (excluye rutas públicas)
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'auth/(.*)', method: RequestMethod.ALL },
        { path: 'webhooks/(.*)', method: RequestMethod.ALL },
        { path: 'crypto/(.*)', method: RequestMethod.ALL },
        { path: 'api/health', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
