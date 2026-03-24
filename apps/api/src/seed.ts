/**
 * Standalone seed entry point compiled into dist/seed.js.
 * Called by entrypoint.sh on first boot when no users exist.
 *
 * Environment variables:
 *   SEED_ADMIN_EMAIL    (default: admin@provired.com)
 *   SEED_ADMIN_PASSWORD (required)
 *   SEED_TENANT_NAME    (default: Provired)
 *   SEED_TENANT_SLUG    (default: provired)
 */

import { prisma } from '@wa/database';
import * as bcrypt from 'bcrypt';

async function main() {

  const email      = process.env.SEED_ADMIN_EMAIL    ?? 'admin@provired.com';
  const password   = process.env.SEED_ADMIN_PASSWORD ?? '';
  const tenantName = process.env.SEED_TENANT_NAME    ?? 'Provired';
  const tenantSlug = process.env.SEED_TENANT_SLUG    ?? 'provired';

  if (!password || password.length < 8) {
    console.error('❌  SEED_ADMIN_PASSWORD is required and must be >= 8 chars');
    await prisma.$disconnect();
    process.exit(1);
  }

  // Create or find admin tenant
  let tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: tenantName, slug: tenantSlug, plan: 'ENTERPRISE', status: 'ACTIVE' },
    });
    console.log(`✅  Tenant: ${tenant.name} (${tenant.id})`);
  }

  // Create SUPER_ADMIN
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        tenantId: tenant.id,
        isEmailVerified: true,
      },
    });
    console.log(`✅  SUPER_ADMIN: ${user.email} (${user.id})`);
  }

  console.log('🚀  Seed complete.');
  await prisma.$disconnect();
}


main().catch(err => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
