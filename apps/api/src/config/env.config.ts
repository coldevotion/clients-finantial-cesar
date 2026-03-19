export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
    groupId: process.env.KAFKA_GROUP_ID ?? 'wa-api-group',
  },
  clickhouse: {
    url: process.env.CLICKHOUSE_URL ?? 'http://localhost:8123',
    db: process.env.CLICKHOUSE_DB ?? 'wa_analytics',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'changeme-generate-with-openssl-rand-hex-64',
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY ?? '',
  },
  mail: {
    host: process.env.SMTP_HOST ?? 'localhost',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    fromName: process.env.MAIL_FROM_NAME ?? 'WA Campaigns',
    fromAddress: process.env.MAIL_FROM_ADDRESS ?? 'noreply@example.com',
  },
  bird: {
    webhookSecret: process.env.BIRD_WEBHOOK_SECRET ?? '',
  },
});
