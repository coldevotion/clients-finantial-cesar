# 04 — Modelo de Base de Datos

## Dos bases de datos

| Base | Tecnología | Para qué |
|---|---|---|
| **Transaccional** | PostgreSQL + Prisma | Tenants, templates, flujos, campañas, contactos, conversaciones |
| **Analytics** | ClickHouse | Eventos de delivery, lecturas, clicks, métricas de campañas |

---

## Esquema PostgreSQL (Prisma)

```prisma
// packages/database/prisma/schema.prisma

model Tenant {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  plan        Plan     @default(STARTER)
  status      TenantStatus @default(ACTIVE)
  createdAt   DateTime @default(now())

  channels      TenantChannel[]
  templates     Template[]
  flows         Flow[]
  campaigns     Campaign[]
  contactLists  ContactList[]
  conversations Conversation[]
}

model TenantChannel {
  id                String  @id @default(uuid())
  tenantId          String
  provider          String  @default("bird")
  birdWorkspaceId   String  // cifrado AES-256
  birdApiKey        String  // cifrado AES-256
  birdChannelId     String
  wabPhoneNumber    String
  isActive          Boolean @default(true)

  tenant Tenant @relation(fields: [tenantId], references: [id])
}

// ─── TEMPLATES ───────────────────────────────────────────────────

model Template {
  id              String   @id @default(uuid())
  tenantId        String
  name            String                    // ej: cobros_atrasados
  birdTemplateId  String?                   // ID en Bird (post-sync)
  status          TemplateStatus            // PENDING | APPROVED | REJECTED
  category        String                    // MARKETING | UTILITY | AUTHENTICATION
  language        String   @default("es")
  components      Json                      // header, body, footer, buttons
  variables       Json                      // lista de vars: {{1}}, {{2}}
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  tenant    Tenant     @relation(...)
  flows     FlowTemplate[]
  campaigns Campaign[]
}

// ─── FLOWS ───────────────────────────────────────────────────────

model Flow {
  id          String   @id @default(uuid())
  tenantId    String
  name        String                        // ej: flujo_cobros_01
  description String?
  status      FlowStatus @default(DRAFT)   // DRAFT | ACTIVE | ARCHIVED
  nodes       Json                          // array de FlowNode
  edges       Json                          // array de FlowEdge
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant       Tenant         @relation(...)
  templates    FlowTemplate[]
  campaigns    Campaign[]
  executions   FlowExecution[]
}

model FlowTemplate {
  flowId      String
  templateId  String
  flow        Flow     @relation(...)
  template    Template @relation(...)
  @@id([flowId, templateId])
}

// ─── CONTACTS ────────────────────────────────────────────────────

model ContactList {
  id        String   @id @default(uuid())
  tenantId  String
  name      String
  createdAt DateTime @default(now())

  contacts  ContactListItem[]
  campaigns Campaign[]
  tenant    Tenant @relation(...)
}

model Contact {
  id          String   @id @default(uuid())
  tenantId    String
  phone       String                        // E.164: +521234567890
  name        String?
  metadata    Json?                         // campos custom del tenant
  optedOut    Boolean  @default(false)
  createdAt   DateTime @default(now())

  lists         ContactListItem[]
  conversations Conversation[]

  @@unique([tenantId, phone])
}

model ContactListItem {
  listId    String
  contactId String
  list      ContactList @relation(...)
  contact   Contact     @relation(...)
  @@id([listId, contactId])
}

// ─── CAMPAIGNS ───────────────────────────────────────────────────

model Campaign {
  id            String         @id @default(uuid())
  tenantId      String
  name          String
  templateId    String
  flowId        String?
  contactListId String
  status        CampaignStatus @default(DRAFT)
  scheduledAt   DateTime?
  startedAt     DateTime?
  completedAt   DateTime?
  totalContacts Int            @default(0)
  sent          Int            @default(0)
  delivered     Int            @default(0)
  read          Int            @default(0)
  failed        Int            @default(0)
  createdAt     DateTime       @default(now())

  tenant      Tenant      @relation(...)
  template    Template    @relation(...)
  flow        Flow?       @relation(...)
  contactList ContactList @relation(...)
  dispatches  MessageDispatch[]
}

model MessageDispatch {
  id            String          @id @default(uuid())
  tenantId      String
  campaignId    String
  contactId     String
  birdMessageId String?
  status        DispatchStatus  @default(PENDING)
  sentAt        DateTime?
  deliveredAt   DateTime?
  readAt        DateTime?
  failedAt      DateTime?
  errorCode     String?
  variables     Json?           // valores de las variables del template

  campaign Campaign @relation(...)
}

// ─── CONVERSATIONS ───────────────────────────────────────────────

model Conversation {
  id              String             @id @default(uuid())
  tenantId        String
  contactId       String
  status          ConversationStatus @default(OPEN)  // OPEN | CLOSED
  activeFlowId    String?
  currentNodeId   String?            // nodo actual en el flow
  startedAt       DateTime           @default(now())
  lastMessageAt   DateTime?
  closedAt        DateTime?

  contact   Contact  @relation(...)
  messages  Message[]
}

model Message {
  id               String      @id @default(uuid())
  tenantId         String
  conversationId   String
  direction        Direction   // INBOUND | OUTBOUND
  type             MessageType // TEXT | IMAGE | DOCUMENT | TEMPLATE | INTERACTIVE
  content          Json        // contenido flexible por tipo
  birdMessageId    String?
  status           MessageStatus
  sentAt           DateTime?
  deliveredAt      DateTime?
  readAt           DateTime?
  createdAt        DateTime    @default(now())

  conversation Conversation @relation(...)
}

// ─── FLOW EXECUTION STATE ────────────────────────────────────────

model FlowExecution {
  id              String          @id @default(uuid())
  tenantId        String
  flowId          String
  conversationId  String
  currentNodeId   String
  status          ExecutionStatus // RUNNING | WAITING | COMPLETED | FAILED
  context         Json            // variables acumuladas del flow
  startedAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  flow Flow @relation(...)
}
```

---

## Esquema ClickHouse (Analytics)

```sql
-- Tabla de eventos de mensajes (append-only, columnar)
CREATE TABLE message_events (
  event_id       UUID,
  tenant_id      UUID,
  campaign_id    UUID,
  contact_id     UUID,
  message_id     UUID,
  event_type     Enum8('sent'=1, 'delivered'=2, 'read'=3, 'failed'=4, 'replied'=5),
  occurred_at    DateTime64(3),
  metadata       String   -- JSON
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(occurred_at)
ORDER BY (tenant_id, campaign_id, occurred_at);

-- Materialized view para stats de campaña (actualizadas en tiempo real)
CREATE MATERIALIZED VIEW campaign_stats_mv
ENGINE = SummingMergeTree()
ORDER BY (tenant_id, campaign_id, event_type)
AS SELECT tenant_id, campaign_id, event_type, count() as total
FROM message_events GROUP BY tenant_id, campaign_id, event_type;
```

---

## Cifrado de credenciales Bird

Las columnas `birdApiKey` y `birdWorkspaceId` en `TenantChannel` se cifran con **AES-256-GCM** usando una clave maestra de entorno (`ENCRYPTION_KEY`). El cifrado/descifrado ocurre en el `CryptoService` del API — Prisma solo almacena el string cifrado en base64.
