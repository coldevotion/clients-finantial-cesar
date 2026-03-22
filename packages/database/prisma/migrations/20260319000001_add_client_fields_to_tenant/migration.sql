-- Add business contact fields to tenants table
ALTER TABLE "tenants" ADD COLUMN "document"     TEXT;
ALTER TABLE "tenants" ADD COLUMN "email"        TEXT;
ALTER TABLE "tenants" ADD COLUMN "phone"        TEXT;
ALTER TABLE "tenants" ADD COLUMN "notes"        TEXT;
ALTER TABLE "tenants" ADD COLUMN "contactLimit" INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE "tenants" ADD COLUMN "omitActive"   BOOLEAN NOT NULL DEFAULT true;

-- Additional indexes for tenant status, contact opt-out, conversation/dispatch status
CREATE INDEX IF NOT EXISTS "tenants_status_idx"                   ON "tenants"("status");
CREATE INDEX IF NOT EXISTS "contacts_tenantId_optedOut_idx"       ON "contacts"("tenantId", "optedOut");
CREATE INDEX IF NOT EXISTS "conversations_tenantId_status_idx"    ON "conversations"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "message_dispatches_tenantId_status_idx" ON "message_dispatches"("tenantId", "status");

-- Add tenant relation to logs (if fk not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'logs_tenantId_fkey'
      AND table_name = 'logs'
  ) THEN
    ALTER TABLE "logs"
      ADD CONSTRAINT "logs_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL;
  END IF;
END $$;

-- Drop redundant clients table if it was ever created
DROP TABLE IF EXISTS "clients";
