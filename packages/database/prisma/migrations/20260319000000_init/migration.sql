-- ─── ENUMS ───────────────────────────────────────────────────────────────────

CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'TENANT_OPERATOR', 'TENANT_VIEWER');
CREATE TYPE "Plan" AS ENUM ('STARTER', 'GROWTH', 'ENTERPRISE');
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE "TemplateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "FlowStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "DispatchStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'FAILED_PERMANENT');
CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "Direction" AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'DOCUMENT', 'TEMPLATE', 'INTERACTIVE');
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');
CREATE TYPE "ExecutionStatus" AS ENUM ('RUNNING', 'WAITING', 'COMPLETED', 'FAILED');
CREATE TYPE "BulkUploadStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "LogLevel" AS ENUM ('INFO', 'WARN', 'ERROR');

-- ─── AUTH ─────────────────────────────────────────────────────────────────────

CREATE TABLE "users" (
    "id"                   TEXT          NOT NULL,
    "email"                TEXT          NOT NULL,
    "passwordHash"         TEXT          NOT NULL,
    "name"                 TEXT,
    "role"                 "UserRole"    NOT NULL DEFAULT 'TENANT_OPERATOR',
    "tenantId"             TEXT,
    "isEmailVerified"      BOOLEAN       NOT NULL DEFAULT false,
    "twoFactorEnabled"     BOOLEAN       NOT NULL DEFAULT false,
    "twoFactorSecret"      TEXT,
    "twoFactorBackupCodes" TEXT[]        NOT NULL DEFAULT '{}',
    "avatarUrl"            TEXT,
    "lastLoginAt"          TIMESTAMP(3),
    "createdAt"            TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3)  NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refresh_tokens" (
    "id"        TEXT         NOT NULL,
    "userId"    TEXT         NOT NULL,
    "tokenHash" TEXT         NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_verifications" (
    "id"        TEXT         NOT NULL,
    "userId"    TEXT         NOT NULL,
    "tokenHash" TEXT         NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt"    TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "password_resets" (
    "id"        TEXT         NOT NULL,
    "userId"    TEXT         NOT NULL,
    "tokenHash" TEXT         NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt"    TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- ─── TENANTS ──────────────────────────────────────────────────────────────────

CREATE TABLE "tenants" (
    "id"        TEXT           NOT NULL,
    "name"      TEXT           NOT NULL,
    "slug"      TEXT           NOT NULL,
    "plan"      "Plan"         NOT NULL DEFAULT 'STARTER',
    "status"    "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3)   NOT NULL,
    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tenant_channels" (
    "id"              TEXT         NOT NULL,
    "tenantId"        TEXT         NOT NULL,
    "provider"        TEXT         NOT NULL DEFAULT 'bird',
    "birdWorkspaceId" TEXT         NOT NULL,
    "birdApiKey"      TEXT         NOT NULL,
    "birdChannelId"   TEXT         NOT NULL,
    "wabPhoneNumber"  TEXT         NOT NULL,
    "isActive"        BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tenant_channels_pkey" PRIMARY KEY ("id")
);

-- ─── TEMPLATES ───────────────────────────────────────────────────────────────

CREATE TABLE "templates" (
    "id"             TEXT             NOT NULL,
    "tenantId"       TEXT             NOT NULL,
    "name"           TEXT             NOT NULL,
    "birdTemplateId" TEXT,
    "status"         "TemplateStatus" NOT NULL DEFAULT 'PENDING',
    "category"       TEXT             NOT NULL,
    "language"       TEXT             NOT NULL DEFAULT 'es',
    "components"     JSONB            NOT NULL DEFAULT '[]',
    "variables"      JSONB            NOT NULL DEFAULT '[]',
    "headerType"     TEXT,
    "headerText"     TEXT,
    "imageUrl"       TEXT,
    "videoUrl"       TEXT,
    "documentUrl"    TEXT,
    "thumbnailUrl"   TEXT,
    "footerText"     TEXT,
    "buttons"        JSONB,
    "bodyText"       TEXT,
    "createdAt"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3)     NOT NULL,
    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- ─── FLOWS ───────────────────────────────────────────────────────────────────

CREATE TABLE "flows" (
    "id"          TEXT         NOT NULL,
    "tenantId"    TEXT         NOT NULL,
    "name"        TEXT         NOT NULL,
    "description" TEXT,
    "status"      "FlowStatus" NOT NULL DEFAULT 'DRAFT',
    "nodes"       JSONB        NOT NULL DEFAULT '[]',
    "edges"       JSONB        NOT NULL DEFAULT '[]',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "flows_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "flow_templates" (
    "flowId"     TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    CONSTRAINT "flow_templates_pkey" PRIMARY KEY ("flowId","templateId")
);

-- ─── CONTACTS ────────────────────────────────────────────────────────────────

CREATE TABLE "contact_lists" (
    "id"        TEXT         NOT NULL,
    "tenantId"  TEXT         NOT NULL,
    "name"      TEXT         NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "contact_lists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contacts" (
    "id"        TEXT         NOT NULL,
    "tenantId"  TEXT         NOT NULL,
    "phone"     TEXT         NOT NULL,
    "name"      TEXT,
    "metadata"  JSONB,
    "optedOut"  BOOLEAN      NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contact_list_items" (
    "listId"    TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    CONSTRAINT "contact_list_items_pkey" PRIMARY KEY ("listId","contactId")
);

-- ─── CAMPAIGNS ───────────────────────────────────────────────────────────────

CREATE TABLE "campaigns" (
    "id"            TEXT             NOT NULL,
    "tenantId"      TEXT             NOT NULL,
    "name"          TEXT             NOT NULL,
    "templateId"    TEXT             NOT NULL,
    "flowId"        TEXT,
    "contactListId" TEXT             NOT NULL,
    "status"        "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt"   TIMESTAMP(3),
    "startedAt"     TIMESTAMP(3),
    "completedAt"   TIMESTAMP(3),
    "totalContacts" INTEGER          NOT NULL DEFAULT 0,
    "sent"          INTEGER          NOT NULL DEFAULT 0,
    "delivered"     INTEGER          NOT NULL DEFAULT 0,
    "read"          INTEGER          NOT NULL DEFAULT 0,
    "failed"        INTEGER          NOT NULL DEFAULT 0,
    "createdAt"     TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3)     NOT NULL,
    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "message_dispatches" (
    "id"            TEXT             NOT NULL,
    "tenantId"      TEXT             NOT NULL,
    "campaignId"    TEXT             NOT NULL,
    "contactId"     TEXT             NOT NULL,
    "birdMessageId" TEXT,
    "status"        "DispatchStatus" NOT NULL DEFAULT 'PENDING',
    "variables"     JSONB,
    "sentAt"        TIMESTAMP(3),
    "deliveredAt"   TIMESTAMP(3),
    "readAt"        TIMESTAMP(3),
    "failedAt"      TIMESTAMP(3),
    "errorCode"     TEXT,
    "createdAt"     TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3)     NOT NULL,
    CONSTRAINT "message_dispatches_pkey" PRIMARY KEY ("id")
);

-- ─── CONVERSATIONS ───────────────────────────────────────────────────────────

CREATE TABLE "conversations" (
    "id"            TEXT                 NOT NULL,
    "tenantId"      TEXT                 NOT NULL,
    "contactId"     TEXT                 NOT NULL,
    "status"        "ConversationStatus" NOT NULL DEFAULT 'OPEN',
    "activeFlowId"  TEXT,
    "currentNodeId" TEXT,
    "startedAt"     TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3),
    "closedAt"      TIMESTAMP(3),
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "messages" (
    "id"             TEXT            NOT NULL,
    "tenantId"       TEXT            NOT NULL,
    "conversationId" TEXT            NOT NULL,
    "direction"      "Direction"     NOT NULL,
    "type"           "MessageType"   NOT NULL,
    "content"        JSONB           NOT NULL,
    "birdMessageId"  TEXT,
    "status"         "MessageStatus" NOT NULL DEFAULT 'SENT',
    "sentAt"         TIMESTAMP(3),
    "deliveredAt"    TIMESTAMP(3),
    "readAt"         TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- ─── FLOW EXECUTION ──────────────────────────────────────────────────────────

CREATE TABLE "flow_executions" (
    "id"             TEXT              NOT NULL,
    "tenantId"       TEXT              NOT NULL,
    "flowId"         TEXT              NOT NULL,
    "conversationId" TEXT              NOT NULL,
    "currentNodeId"  TEXT              NOT NULL,
    "status"         "ExecutionStatus" NOT NULL DEFAULT 'RUNNING',
    "context"        JSONB             NOT NULL DEFAULT '{}',
    "startedAt"      TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3)      NOT NULL,
    CONSTRAINT "flow_executions_pkey" PRIMARY KEY ("id")
);

-- ─── CLIENTS ─────────────────────────────────────────────────────────────────

CREATE TABLE "clients" (
    "id"           TEXT         NOT NULL,
    "tenantId"     TEXT         NOT NULL,
    "name"         TEXT         NOT NULL,
    "document"     TEXT,
    "email"        TEXT,
    "phone"        TEXT,
    "contactLimit" INTEGER      NOT NULL DEFAULT 1000,
    "omitActive"   BOOLEAN      NOT NULL DEFAULT true,
    "notes"        TEXT,
    "isActive"     BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- ─── BULK UPLOADS ────────────────────────────────────────────────────────────

CREATE TABLE "bulk_uploads" (
    "id"            TEXT               NOT NULL,
    "tenantId"      TEXT               NOT NULL,
    "fileName"      TEXT               NOT NULL,
    "fileSize"      INTEGER            NOT NULL,
    "mimeType"      TEXT               NOT NULL,
    "status"        "BulkUploadStatus" NOT NULL DEFAULT 'PENDING',
    "totalRows"     INTEGER            NOT NULL DEFAULT 0,
    "processedRows" INTEGER            NOT NULL DEFAULT 0,
    "failedRows"    INTEGER            NOT NULL DEFAULT 0,
    "errorLog"      JSONB,
    "storagePath"   TEXT               NOT NULL,
    "listId"        TEXT,
    "createdAt"     TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3)       NOT NULL,
    CONSTRAINT "bulk_uploads_pkey" PRIMARY KEY ("id")
);

-- ─── LOGS ─────────────────────────────────────────────────────────────────────

CREATE TABLE "logs" (
    "id"         TEXT         NOT NULL,
    "tenantId"   TEXT,
    "level"      "LogLevel"   NOT NULL DEFAULT 'INFO',
    "action"     TEXT         NOT NULL,
    "resource"   TEXT,
    "resourceId" TEXT,
    "userId"     TEXT,
    "meta"       JSONB,
    "ip"         TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- ─── UNIQUE CONSTRAINTS ───────────────────────────────────────────────────────

CREATE UNIQUE INDEX "users_email_key"                ON "users"("email");
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key"   ON "refresh_tokens"("tokenHash");
CREATE UNIQUE INDEX "email_verifications_tokenHash_key" ON "email_verifications"("tokenHash");
CREATE UNIQUE INDEX "password_resets_tokenHash_key"  ON "password_resets"("tokenHash");
CREATE UNIQUE INDEX "tenants_slug_key"               ON "tenants"("slug");
CREATE UNIQUE INDEX "templates_tenantId_name_key"    ON "templates"("tenantId", "name");
CREATE UNIQUE INDEX "contacts_tenantId_phone_key"    ON "contacts"("tenantId", "phone");
CREATE UNIQUE INDEX "clients_tenantId_document_key"  ON "clients"("tenantId", "document");

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

CREATE INDEX "users_email_idx"                           ON "users"("email");
CREATE INDEX "users_tenantId_idx"                        ON "users"("tenantId");
CREATE INDEX "refresh_tokens_userId_idx"                 ON "refresh_tokens"("userId");
CREATE INDEX "tenants_slug_idx"                          ON "tenants"("slug");
CREATE INDEX "tenant_channels_tenantId_idx"              ON "tenant_channels"("tenantId");
CREATE INDEX "templates_tenantId_idx"                    ON "templates"("tenantId");
CREATE INDEX "flows_tenantId_idx"                        ON "flows"("tenantId");
CREATE INDEX "contact_lists_tenantId_idx"                ON "contact_lists"("tenantId");
CREATE INDEX "contacts_tenantId_idx"                     ON "contacts"("tenantId");
CREATE INDEX "campaigns_tenantId_idx"                    ON "campaigns"("tenantId");
CREATE INDEX "campaigns_tenantId_status_idx"             ON "campaigns"("tenantId", "status");
CREATE INDEX "message_dispatches_tenantId_idx"           ON "message_dispatches"("tenantId");
CREATE INDEX "message_dispatches_campaignId_idx"         ON "message_dispatches"("campaignId");
CREATE INDEX "message_dispatches_birdMessageId_idx"      ON "message_dispatches"("birdMessageId");
CREATE INDEX "conversations_tenantId_idx"                ON "conversations"("tenantId");
CREATE INDEX "conversations_tenantId_contactId_idx"      ON "conversations"("tenantId", "contactId");
CREATE INDEX "messages_tenantId_idx"                     ON "messages"("tenantId");
CREATE INDEX "messages_conversationId_idx"               ON "messages"("conversationId");
CREATE INDEX "messages_birdMessageId_idx"                ON "messages"("birdMessageId");
CREATE INDEX "flow_executions_tenantId_idx"              ON "flow_executions"("tenantId");
CREATE INDEX "flow_executions_conversationId_idx"        ON "flow_executions"("conversationId");
CREATE INDEX "clients_tenantId_idx"                      ON "clients"("tenantId");
CREATE INDEX "bulk_uploads_tenantId_idx"                 ON "bulk_uploads"("tenantId");
CREATE INDEX "bulk_uploads_tenantId_status_idx"          ON "bulk_uploads"("tenantId", "status");
CREATE INDEX "logs_tenantId_idx"                         ON "logs"("tenantId");
CREATE INDEX "logs_level_idx"                            ON "logs"("level");
CREATE INDEX "logs_createdAt_idx"                        ON "logs"("createdAt");

-- ─── FOREIGN KEYS ─────────────────────────────────────────────────────────────

ALTER TABLE "users"
    ADD CONSTRAINT "users_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_verifications"
    ADD CONSTRAINT "email_verifications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "password_resets"
    ADD CONSTRAINT "password_resets_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tenant_channels"
    ADD CONSTRAINT "tenant_channels_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "templates"
    ADD CONSTRAINT "templates_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "flows"
    ADD CONSTRAINT "flows_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "flow_templates"
    ADD CONSTRAINT "flow_templates_flowId_fkey"
    FOREIGN KEY ("flowId") REFERENCES "flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "flow_templates"
    ADD CONSTRAINT "flow_templates_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contact_lists"
    ADD CONSTRAINT "contact_lists_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contacts"
    ADD CONSTRAINT "contacts_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contact_list_items"
    ADD CONSTRAINT "contact_list_items_listId_fkey"
    FOREIGN KEY ("listId") REFERENCES "contact_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contact_list_items"
    ADD CONSTRAINT "contact_list_items_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "campaigns"
    ADD CONSTRAINT "campaigns_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "campaigns"
    ADD CONSTRAINT "campaigns_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON UPDATE CASCADE;

ALTER TABLE "campaigns"
    ADD CONSTRAINT "campaigns_flowId_fkey"
    FOREIGN KEY ("flowId") REFERENCES "flows"("id") ON UPDATE CASCADE;

ALTER TABLE "campaigns"
    ADD CONSTRAINT "campaigns_contactListId_fkey"
    FOREIGN KEY ("contactListId") REFERENCES "contact_lists"("id") ON UPDATE CASCADE;

ALTER TABLE "message_dispatches"
    ADD CONSTRAINT "message_dispatches_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "message_dispatches"
    ADD CONSTRAINT "message_dispatches_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON UPDATE CASCADE;

ALTER TABLE "conversations"
    ADD CONSTRAINT "conversations_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON UPDATE CASCADE;

ALTER TABLE "conversations"
    ADD CONSTRAINT "conversations_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages"
    ADD CONSTRAINT "messages_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "flow_executions"
    ADD CONSTRAINT "flow_executions_flowId_fkey"
    FOREIGN KEY ("flowId") REFERENCES "flows"("id") ON UPDATE CASCADE;

ALTER TABLE "clients"
    ADD CONSTRAINT "clients_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bulk_uploads"
    ADD CONSTRAINT "bulk_uploads_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
