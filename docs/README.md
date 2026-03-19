# WA Campaigns Platform — Documentación de Arquitectura

Plataforma **whitelabel multi-tenant** para envíos masivos de plantillas de WhatsApp con constructor visual de flujos conversacionales.

## Stack general

| Capa | Tecnología | Por qué |
|---|---|---|
| Monorepo | Turborepo + pnpm workspaces | Cache builds compartidos, scripts unificados |
| API Core | NestJS (TypeScript) | Módulos, DI, decoradores — ideal para arquitectura grande |
| Worker | NestJS Worker app | Separación de cómputo pesado del API |
| Frontend | Next.js 15 (App Router) | SSR, Server Actions, multi-tenant routing |
| Flow Builder UI | React Flow | Canvas drag & drop, nodos custom, edges condicionales |
| Base de datos | PostgreSQL + Prisma | Transaccional, multi-tenant row-level |
| Analytics | ClickHouse | Columnar, millones de eventos, reportes rápidos |
| Caché / State | Redis (Cluster) | Sesiones de flujos activos, rate limiting, locks |
| Mensajería async | Kafka | Pipeline de campañas a escala de millones |
| Jobs background | BullMQ + Redis | Webhooks, retries, flow transitions |
| Proveedor WA | Bird (ex-MessageBird) | WhatsApp Business API, multi-workspace |
| Auth | Clerk (multi-tenant) | Orgs, RBAC, SSO listo para whitelabel |
| Diseño UI | ui-ux-pro-max (skill) | Sistema de diseño consistente |
| Infra Dev | Docker Compose | Postgres + Redis + Kafka + ClickHouse local |
| Infra Prod | Kubernetes (GKE/EKS) | Horizontal scaling, workers independientes |

---

## Documentación

### Arquitectura
- [01 — Vista general del sistema](./architecture/01-overview.md)
- [02 — Estructura del monorepo](./architecture/02-monorepo-structure.md)
- [03 — Estrategia multi-tenant](./architecture/03-multi-tenancy.md)
- [04 — Modelo de base de datos](./architecture/04-database.md)
- [05 — Módulos del API](./architecture/05-api-modules.md)
- [06 — Motor de flujos](./architecture/06-flow-engine.md)
- [07 — Pipeline de mensajería masiva](./architecture/07-messaging-pipeline.md)
- [08 — Frontend y Flow Builder](./architecture/08-frontend.md)
- [09 — Infraestructura y deployment](./architecture/09-infra.md)

### Integraciones
- [Bird API (WhatsApp Provider)](./integrations/bird.md)

### Decisiones de Arquitectura (ADR)
- [ADR-001 — Bird como proveedor whitelabel](./decisions/ADR-001-bird-whitelabel.md)
- [ADR-002 — Kafka para escala de millones](./decisions/ADR-002-kafka-scale.md)
- [ADR-003 — Estrategia multi-tenant row-level](./decisions/ADR-003-multi-tenant-strategy.md)

---

> Última actualización: Marzo 2026
