# 05 — Módulos del API (NestJS)

## Mapa de módulos

```
AppModule
├── AuthModule          ← Clerk JWT, guards, decorators
├── TenantsModule       ← CRUD tenants, canales Bird
├── TemplatesModule     ← Templates WA + sync con Bird
├── FlowsModule         ← Constructor de flujos (CRUD grafo)
├── CampaignsModule     ← Crear, lanzar y monitorear campañas
├── ContactsModule      ← Contactos + listas
├── ConversationsModule ← Historial + WebSocket en tiempo real
├── WebhooksModule      ← Receptor de eventos Bird (inbound)
├── AnalyticsModule     ← Reportes vía ClickHouse
└── QueueModule         ← BullMQ producers (publica jobs)
```

---

## Endpoints principales

### Templates — `/api/templates`

```
GET    /api/templates              → listar templates del tenant
POST   /api/templates              → crear template
GET    /api/templates/:id          → detalle
PATCH  /api/templates/:id          → actualizar
DELETE /api/templates/:id          → eliminar
POST   /api/templates/:id/sync     → sincronizar con Bird (envía a Meta para aprobación)
GET    /api/templates/:id/status   → estado de aprobación en Meta
```

### Flows — `/api/flows`

```
GET    /api/flows                  → listar flujos
POST   /api/flows                  → crear flujo (con nodes/edges iniciales)
GET    /api/flows/:id              → detalle completo (nodes + edges)
PATCH  /api/flows/:id              → actualizar nombre/status
PUT    /api/flows/:id/graph        → guardar grafo completo (auto-save del builder)
DELETE /api/flows/:id
POST   /api/flows/:id/activate     → activar flujo (validación previa)
POST   /api/flows/:id/test         → ejecutar flujo en modo test con número propio
```

### Campaigns — `/api/campaigns`

```
GET    /api/campaigns
POST   /api/campaigns              → crear campaña (template + flow + lista)
GET    /api/campaigns/:id
PATCH  /api/campaigns/:id
POST   /api/campaigns/:id/launch   → lanzar ahora o programar
POST   /api/campaigns/:id/pause    → pausar campaña en curso
POST   /api/campaigns/:id/cancel   → cancelar
GET    /api/campaigns/:id/stats    → métricas en tiempo real
GET    /api/campaigns/:id/report   → reporte completo (ClickHouse)
```

### Contacts — `/api/contacts`

```
GET    /api/contacts
POST   /api/contacts
POST   /api/contacts/import        → importar CSV
DELETE /api/contacts/:id

GET    /api/contact-lists
POST   /api/contact-lists
POST   /api/contact-lists/:id/contacts  → agregar contactos a lista
DELETE /api/contact-lists/:id
```

### Conversations — `/api/conversations`

```
GET    /api/conversations                → listar (filtros: status, contacto, fecha)
GET    /api/conversations/:id            → historial de mensajes
POST   /api/conversations/:id/reply     → responder manualmente (fuera del flujo)
POST   /api/conversations/:id/close
GET    /api/conversations/:id/flow-state → estado actual del flujo en esa conv.
```

### Webhooks — `/webhooks/bird`

```
POST   /webhooks/bird/:tenantId    → receptor de eventos Bird
                                     (delivery status + inbound messages)
```

### Analytics — `/api/analytics`

```
GET    /api/analytics/dashboard         → métricas generales del tenant
GET    /api/analytics/campaigns/:id     → detalle de campaña
GET    /api/analytics/conversations     → stats de conversaciones
GET    /api/analytics/flows/:id         → stats de ejecuciones del flujo
```

---

## Guards y Decoradores

```typescript
// Todos los endpoints protegidos por:
@UseGuards(ClerkAuthGuard)        // valida JWT de Clerk
@UseGuards(TenantGuard)           // inyecta tenantId en request
@Roles('tenant_admin', 'tenant_operator')  // RBAC

// Decorador custom para extraer tenant del request:
@CurrentTenant() tenant: Tenant
```

---

## WebSocket Gateway (Conversaciones en tiempo real)

```typescript
// ConversationsGateway — notifica al frontend cuando:
// 1. Llega un mensaje inbound
// 2. Cambia el status de un mensaje outbound
// 3. El flow engine ejecuta una acción

@WebSocketGateway({ namespace: '/conversations' })
export class ConversationsGateway {
  // Rooms por conversationId
  // Auth: mismo JWT de Clerk
}
```

---

## Validación y Transformación

- Todos los DTOs usan `class-validator` + `class-transformer`
- `ValidationPipe` global con `whitelist: true, forbidNonWhitelisted: true`
- Responses normalizadas con `ResponseInterceptor` (data, meta, pagination)
- Errores normalizados con `HttpExceptionFilter`
