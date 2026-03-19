# 01 — Vista General del Sistema

## Qué hace la plataforma

Sistema whitelabel SaaS que permite a empresas (tenants) enviar plantillas de WhatsApp de forma masiva a sus contactos, y construir flujos conversacionales automatizados que se activan tras cada envío o respuesta.

---

## Diagrama de alto nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                        TENANT (empresa)                         │
│                                                                 │
│   Dashboard Web (Next.js)                                       │
│   ├── Gestión de Templates                                      │
│   ├── Constructor de Flujos  ←── React Flow (drag & drop)       │
│   ├── Campañas (envíos masivos)                                 │
│   ├── Conversaciones (historial)                                │
│   └── Reportes / Analytics                                      │
└────────────────┬────────────────────────────────────────────────┘
                 │ HTTPS / WebSocket
┌────────────────▼────────────────────────────────────────────────┐
│                         API (NestJS)                            │
│   ├── REST endpoints por módulo                                 │
│   ├── WebSocket gateway (conversaciones en tiempo real)         │
│   └── Webhook receiver (eventos Bird entrantes)                 │
└──────┬──────────────────┬──────────────────────────────────────┘
       │ Kafka produce     │ BullMQ jobs
┌──────▼──────┐   ┌────────▼──────────────────────────────────────┐
│    Kafka    │   │              Worker (NestJS)                   │
│  (Campaign  │   │  ├── Flow Engine (procesa nodos activos)       │
│   Topic)    │   │  ├── Webhook Processor                        │
└──────┬──────┘   │  └── Retry / Delay jobs                       │
       │          └────────────────────┬──────────────────────────┘
       │ consume                       │ Bird API calls
┌──────▼──────────────────────────────▼──────────────────────────┐
│                    Bird API (WhatsApp)                          │
│   ├── Workspace por tenant (aislamiento)                        │
│   ├── Send template messages                                    │
│   ├── Inbound webhook → nuestro API                             │
│   └── Template management (sync con Meta)                       │
└─────────────────────────────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────────────┐
│                    Almacenamiento                               │
│   ├── PostgreSQL  → datos transaccionales (tenants, templates,  │
│   │                 flows, campaigns, contacts, conversations)   │
│   ├── ClickHouse  → eventos analytics (delivery, reads, clicks) │
│   └── Redis       → estado de flujos activos, cache, rate limit │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flujo principal de una campaña

```
1. Admin crea Template en Bird (sincronizado vía API)
2. Admin construye Flow y lo asocia al Template
3. Admin crea Campaña: Template + Flow + Lista de Contactos
4. Al lanzar Campaña:
   a. API publica N mensajes en Kafka topic "campaign.dispatch"
   b. Workers consumen y llaman Bird API (respetando rate limits)
   c. Bird entrega mensajes a contactos en WhatsApp
   d. Bird envía webhook de status (delivered, read, failed)
5. Cuando contacto responde:
   a. Bird webhook → nuestro API
   b. API identifica tenant + conversación activa
   c. BullMQ job → Worker ejecuta Flow Engine
   d. Flow Engine evalúa nodo actual, decide siguiente acción
   e. Si acción = enviar mensaje → Bird API
   f. Todos los eventos se guardan en PostgreSQL + ClickHouse
```

---

## Actores del sistema

| Actor | Descripción |
|---|---|
| **Super Admin** | Nosotros — gestiona tenants, planes, Bird workspaces |
| **Tenant Admin** | Cliente whitelabel — gestiona su empresa, usuarios, canales |
| **Tenant User** | Operador del tenant — crea campañas, ve reportes |
| **Contacto** | Usuario final en WhatsApp (no tiene acceso al sistema) |

---

## Principios de diseño

1. **Aislamiento por tenant** — ningún tenant puede ver ni afectar datos de otro
2. **Escalabilidad horizontal** — workers de Kafka escalan independientemente
3. **Idempotencia** — reenvíos y retries no duplican mensajes
4. **Observabilidad** — cada evento tiene trace_id, tenant_id, timestamp
5. **Whitelabel transparente** — el contacto final nunca sabe que usamos Bird
