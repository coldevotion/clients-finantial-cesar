import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { prisma } from "@wa/database";
import { hash } from "bcrypt";

async function autoSeed() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@admin.com";
  const password = process.env.SEED_ADMIN_PASSWORD;
  const tenantName = process.env.SEED_TENANT_NAME ?? "Default";
  const tenantSlug = process.env.SEED_TENANT_SLUG ?? "default";

  if (!password || password.length < 8) {
    console.warn(
      "[seed] SEED_ADMIN_PASSWORD not set or too short — skipping auto-seed",
    );
    return;
  }

  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log("[seed] Users exist — skipping auto-seed");
    return;
  }

  console.log("[seed] No users found — running auto-seed...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    update: {},
    create: {
      name: tenantName,
      slug: tenantSlug,
      plan: "ENTERPRISE",
      status: "ACTIVE",
    },
  });

  const passwordHash = await hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: "Admin",
      role: "SUPER_ADMIN",
      tenantId: tenant.id,
      isEmailVerified: true,
    },
  });

  console.log(`[seed] Admin user created: ${email}`);
}

async function bootstrap() {
  await autoSeed();

  const app = await NestFactory.create(AppModule, {
    rawBody: true, // needed for webhook signature verification
  });

  app.setGlobalPrefix("api");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`API running on port ${port}`);
}

bootstrap();
