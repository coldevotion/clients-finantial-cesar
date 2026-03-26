# 02 — Estructura del Monorepo

## Herramientas

- **pnpm workspaces** — gestión de dependencias y hoisting
- **Turborepo** — pipeline de builds/tests con cache distribuido

---

## Estructura completa

```
wa-campaigns-platform/
│
├── apps/
│   ├── api/                        ← NestJS API principal
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/           ← JWT, guards, Clerk integration
│   │   │   │   ├── tenants/        ← CRUD tenants + Bird workspace config
│   │   │   │   ├── templates/      ← Sync y CRUD de plantillas WA
│   │   │   │   ├── flows/          ← CRUD flujos (grafo nodos/edges)
│   │   │   │   ├── campaigns/      ← Crear y lanzar campañas
│   │   │   │   ├── contacts/       ← Contactos y listas
│   │   │   │   ├── conversations/  ← Historial de conversaciones
│   │   │   │   ├── webhooks/       ← Receptor de eventos Bird
│   │   │   │   └── analytics/      ← Queries a ClickHouse
│   │   │   ├── common/             ← Guards, interceptors, decorators
│   │   │   ├── config/             ← Variables de entorno tipadas
│   │   │   └── main.ts
│   │   ├── test/
│   │   └── package.json
│   │
│   ├── worker/                     ← NestJS Worker (procesamiento async)
│   │   ├── src/
│   │   │   ├── consumers/
│   │   │   │   ├── campaign.consumer.ts    ← Kafka: dispatch mensajes
│   │   │   │   └── webhook.consumer.ts     ← BullMQ: procesa webhooks
│   │   │   ├── processors/
│   │   │   │   └── flow-engine.processor.ts ← Ejecuta nodos de flujo
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   └── web/                        ← Next.js 15 Dashboard
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/         ← Login, register
│       │   │   ├── (dashboard)/
│       │   │   │   ├── templates/
│       │   │   │   ├── flows/      ← Flow Builder (React Flow)
│       │   │   │   ├── campaigns/
│       │   │   │   ├── contacts/
│       │   │   │   ├── conversations/
│       │   │   │   └── analytics/
│       │   │   └── layout.tsx
│       │   ├── components/
│       │   │   ├── flow-builder/   ← Nodos custom, panels, canvas
│       │   │   └── ui/             ← shadcn/ui base + ui-ux-pro-max
│       │   └── lib/
│       └── package.json
│
├── packages/
│   ├── database/                   ← Prisma schema + client compartido
│   │   ├── prisma/
│   │   │   ├── schema.prisma       ← Modelos multi-tenant
│   │   │   └── migrations/
│   │   └── package.json
│   │
│   ├── types/                      ← Tipos TypeScript compartidos
│   │   ├── src/
│   │   │   ├── tenant.types.ts
│   │   │   ├── flow.types.ts       ← FlowNode, FlowEdge, NodeType enum
│   │   │   ├── campaign.types.ts
│   │   │   └── bird.types.ts       ← Bird API request/response types
│   │   └── package.json
│   │
│   ├── bird-client/                ← SDK wrapper de Bird API
│   │   ├── src/
│   │   │   ├── bird.client.ts      ← HTTP client con retry + rate limit
│   │   │   ├── templates.service.ts
│   │   │   ├── messages.service.ts
│   │   │   └── webhooks.validator.ts
│   │   └── package.json
│   │
│   ├── flow-engine/                ← Motor de ejecución de flujos
│   │   ├── src/
│   │   │   ├── engine.ts           ← Ejecutor principal
│   │   │   ├── nodes/              ← Un handler por tipo de nodo
│   │   │   │   ├── send-message.node.ts
│   │   │   │   ├── wait-response.node.ts
│   │   │   │   ├── condition.node.ts
│   │   │   │   ├── delay.node.ts
│   │   │   │   └── end.node.ts
│   │   │   └── types.ts
│   │   └── package.json
│   │
│   └── ui/                         ← Componentes React compartidos
│       ├── src/
│       │   ├── components/         ← Diseñados con ui-ux-pro-max
│       │   └── index.ts
│       └── package.json
│
├── docs/                           ← Esta documentación
│
├── infra/
│   └── docker-compose.yml          ← Dev: PG + Redis + Kafka + ClickHouse
│
├── turbo.json                      ← Pipeline Turborepo
├── pnpm-workspace.yaml
└── package.json
```

---

## Pipeline Turborepo

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {}
  }
}
```

## Scripts raíz principales

```bash
pnpm dev              # levanta api + worker + web en paralelo
pnpm build            # build de todo el monorepo
pnpm test             # tests de todos los packages
pnpm db:migrate       # prisma migrate deploy
pnpm db:studio        # Prisma Studio
pnpm infra:up         # docker-compose up
pnpm infra:down       # docker-compose down
```
