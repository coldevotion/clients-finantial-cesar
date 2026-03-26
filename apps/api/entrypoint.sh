#!/bin/sh
set -e

echo "▶ Running Prisma migrations..."
node ./node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma

# Run seed only on first boot (no users in DB yet).
# Redirect stderr to /dev/null so Prisma connection logs don't pollute USER_COUNT.
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ log: [] });
p.user.count().then(n => { process.stdout.write(String(n)); p.\$disconnect(); }).catch(() => { process.stdout.write('1'); });
" 2>/dev/null) || USER_COUNT="1"

if [ "$USER_COUNT" = "0" ]; then
  echo "▶ No users found — running seed..."
  SEED_ADMIN_EMAIL="${SEED_ADMIN_EMAIL:-admin@provired.com}" \
  SEED_ADMIN_PASSWORD="${SEED_ADMIN_PASSWORD}" \
  SEED_TENANT_NAME="${SEED_TENANT_NAME:-Provired}" \
  SEED_TENANT_SLUG="${SEED_TENANT_SLUG:-provired}" \
  node dist/seed.js
else
  echo "▶ Database already seeded (${USER_COUNT} users found), skipping."
fi

echo "▶ Starting API server..."
exec node dist/main
