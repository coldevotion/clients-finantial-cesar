-- CreateTable
CREATE TABLE "nav_modules" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "nav_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_modules" (
    "tenantId" TEXT NOT NULL,
    "navModuleId" TEXT NOT NULL,

    CONSTRAINT "tenant_modules_pkey" PRIMARY KEY ("tenantId","navModuleId")
);

-- CreateIndex
CREATE UNIQUE INDEX "nav_modules_key_key" ON "nav_modules"("key");

-- AddForeignKey
ALTER TABLE "tenant_modules" ADD CONSTRAINT "tenant_modules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_modules" ADD CONSTRAINT "tenant_modules_navModuleId_fkey" FOREIGN KEY ("navModuleId") REFERENCES "nav_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
