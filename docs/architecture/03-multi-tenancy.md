# 03 — Estrategia Multi-Tenant

## Modelo elegido: Row-Level Tenancy

Todos los modelos de la base de datos incluyen `tenantId`. Un middleware de NestJS inyecta el `tenantId` en cada request automáticamente, antes de llegar a cualquier servicio.

```
Request → TenantMiddleware → Controller → Service → Prisma (WHERE tenantId = ?)
```

### Por qué row-level y no schema-per-tenant

| Criterio | Row-Level | Schema-per-tenant |
|---|---|---|
| Complejidad operacional | Baja | Alta (N migraciones) |
| Escala de tenants | Miles sin problema | Difícil >100 tenants |
| Aislamiento | Bueno (enforced en app) | Excelente (DB nativo) |
| Queries cross-tenant | Posibles (super admin) | Complicadas |
| Costo infra | Una DB | Una DB por tenant |

Para el nivel de escala actual (whitelabel SaaS), row-level es suficiente y mucho más manejable.

---

## Aislamiento de Bird por Tenant

Cada tenant tiene su propio **Bird Workspace** con sus propias credenciales:

```
Tenant A → bird_workspace_id: "ws_aaa" + bird_api_key: "key_aaa"
Tenant B → bird_workspace_id: "ws_bbb" + bird_api_key: "key_bbb"
```

Las credenciales se almacenan cifradas en la tabla `tenant_channels`. El `bird-client` package recibe las credenciales del tenant activo en cada request — nunca usa credenciales globales.

---

## Modelo de datos de tenant

```
Tenant
├── id (UUID)
├── name
├── slug (subdominio: acme.waplatform.com)
├── plan (STARTER | GROWTH | ENTERPRISE)
├── status (ACTIVE | SUSPENDED)
└── TenantChannel[]
    ├── provider: "bird"
    ├── birdWorkspaceId (cifrado)
    ├── birdApiKey (cifrado)
    ├── birdChannelId (WhatsApp channel en Bird)
    └── wabPhoneNumber

Tenant también tiene:
├── Users[] (vía Clerk org)
├── Templates[]
├── Flows[]
├── Campaigns[]
├── ContactLists[]
└── Conversations[]
```

---

## TenantMiddleware (NestJS)

```typescript
// Extrae tenantId del JWT (Clerk) o del subdominio
// Lo inyecta en el request para que todos los servicios lo usen

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.user?.tenantId ?? extractFromSubdomain(req.hostname);
    if (!tenantId) throw new UnauthorizedException('No tenant context');
    req.tenantId = tenantId;
    next();
  }
}
```

---

## Routing multi-tenant en el frontend

```
Opción A (subdominio):  acme.waplatform.com
Opción B (path):        waplatform.com/t/acme

→ Usaremos subdominio con wildcard DNS: *.waplatform.com
→ Next.js middleware detecta el subdominio y carga el tenant context
```

---

## Niveles de acceso (RBAC)

| Rol | Puede |
|---|---|
| `super_admin` | Ver todos los tenants, configurar planes, suspender |
| `tenant_admin` | Gestionar su tenant, usuarios, canales Bird, billing |
| `tenant_operator` | Crear campañas, flujos, templates, ver reportes |
| `tenant_viewer` | Solo ver reportes y conversaciones |

RBAC implementado via **Clerk Organizations + Roles** — no reinventamos la rueda.

---

## Consideración para Enterprise

Tenants con plan ENTERPRISE pueden solicitar:
- Schema dedicado en PostgreSQL (máximo aislamiento)
- Worker pool dedicado (no comparte recursos con otros tenants)
- Bird account propio (su propia relación con Bird)

Esto se contempla en la arquitectura pero no se implementa en fase 1.
