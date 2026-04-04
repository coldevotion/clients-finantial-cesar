/**
 * Seed script — bootstraps the first SUPER_ADMIN + admin Tenant.
 *
 * Run: pnpm --filter @wa/database seed
 *
 * Environment variables required:
 *   DATABASE_URL       — Postgres connection string
 *   SEED_ADMIN_EMAIL   — email for the SUPER_ADMIN (default: admin@cobrix.com)
 *   SEED_ADMIN_PASSWORD — password for the SUPER_ADMIN (required, min 8 chars)
 *   SEED_TENANT_NAME   — tenant name (default: Cobrix)
 *   SEED_TENANT_SLUG   — tenant slug (default: cobrix)
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const INITIAL_MODULES = [
  // Módulos de tenant (isSuperAdmin: false)
  { key: '/',              label: 'Dashboard',      icon: 'LayoutDashboard', order: 0, isSuperAdmin: false },
  { key: '/templates',     label: 'Plantillas HSM', icon: 'FileText',        order: 1, isSuperAdmin: false },
  { key: '/flows',         label: 'Flujos',         icon: 'Workflow',        order: 2, isSuperAdmin: false },
  { key: '/campaigns',     label: 'Campañas',       icon: 'Megaphone',       order: 3, isSuperAdmin: false },
  { key: '/contacts',      label: 'Contactos',      icon: 'Users',           order: 4, isSuperAdmin: false },
  { key: '/uploads',       label: 'Cargue masivo',  icon: 'Upload',          order: 5, isSuperAdmin: false },
  { key: '/conversations', label: 'Conversaciones', icon: 'MessageSquare',   order: 6, isSuperAdmin: false },
  { key: '/reports',       label: 'Reportes',       icon: 'PieChart',        order: 7, isSuperAdmin: false },
  // Módulos de administración (isSuperAdmin: true — sección Administración)
  { key: '/admin/clients', label: 'Clientes',       icon: 'Building2',       order: 0, isSuperAdmin: true },
  { key: '/admin/users',   label: 'Usuarios',       icon: 'UsersRound',      order: 1, isSuperAdmin: true },
  { key: '/admin/system',  label: 'Sistema y Logs', icon: 'Activity',        order: 2, isSuperAdmin: true },
];

async function main() {
  const email    = process.env.SEED_ADMIN_EMAIL    ?? 'admin@cobrix.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? '';
  const tenantName = process.env.SEED_TENANT_NAME  ?? 'Cobrix';
  const tenantSlug = process.env.SEED_TENANT_SLUG  ?? 'cobrix';

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

  // ── 3. Seed nav modules ────────────────────────────────────────────────────
  for (const mod of INITIAL_MODULES) {
    await prisma.navModule.upsert({
      where: { key: mod.key },
      update: { label: mod.label, icon: mod.icon, order: mod.order },
      create: mod,
    });
  }
  console.log(`✅  Nav modules seeded: ${INITIAL_MODULES.length} modules`);

  console.log('\n🚀  Seed complete.');
}

main()
  .catch(err => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
