-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "isLimit" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "contactLimit" SET DEFAULT 0;
