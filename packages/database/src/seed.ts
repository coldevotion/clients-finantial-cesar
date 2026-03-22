/**
 * Seed script — bootstraps the first SUPER_ADMIN + admin Tenant.
 *
 * Run: pnpm --filter @wa/database seed
 *
 * Environment variables required:
 *   DATABASE_URL       — Postgres connection string
 *   SEED_ADMIN_EMAIL   — email for the SUPER_ADMIN (default: admin@provired.com)
 *   SEED_ADMIN_PASSWORD — password for the SUPER_ADMIN (required, min 8 chars)
 *   SEED_TENANT_NAME   — tenant name (default: Provired)
 *   SEED_TENANT_SLUG   — tenant slug (default: provired)
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email    = process.env.SEED_ADMIN_EMAIL    ?? 'admin@provired.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? '';
  const tenantName = process.env.SEED_TENANT_NAME  ?? 'Provired';
  const tenantSlug = process.env.SEED_TENANT_SLUG  ?? 'provired';

  if (!password || password.length < 8) {
    console.error('❌  SEED_ADMIN_PASSWORD is required and must be at least 8 characters.');
    process.exit(1);
  }

  // ── 1. Create or find admin tenant ─────────────────────────────────────────
  let tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        slug: tenantSlug,
        plan: 'ENTERPRISE',
        status: 'ACTIVE',
      },
    });
    console.log(`✅  Tenant created: ${tenant.name} (${tenant.id})`);
  } else {
    console.log(`ℹ️   Tenant already exists: ${tenant.name} (${tenant.id})`);
  }

  // ── 2. Create or find SUPER_ADMIN user ─────────────────────────────────────
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const passwordHash = await bcrypt.hash(password, 12);
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        tenantId: tenant.id,
        isEmailVerified: true,
      },
    });
    console.log(`✅  SUPER_ADMIN created: ${user.email} (${user.id})`);
  } else {
    console.log(`ℹ️   User already exists: ${user.email} (${user.id})`);
  }

  console.log('\n🚀  Seed complete.');
}

main()
  .catch(err => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
