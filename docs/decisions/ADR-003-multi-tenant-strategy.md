# ADR-003 — Estrategia multi-tenant: Row-Level Tenancy

**Estado:** Aceptado
**Fecha:** Marzo 2026

## Contexto

El sistema es multi-tenant (varios clientes/empresas usan la misma plataforma). Necesitamos decidir cómo aislar los datos de cada tenant en la base de datos.

## Decisión

Usamos **row-level tenancy**: todos los modelos tienen un campo `tenantId` (UUID). Un middleware de NestJS inyecta el `tenantId` en cada request y todos los queries de Prisma incluyen `WHERE tenant_id = ?` automáticamente.

## Razones

1. **Un solo schema**, una sola migración que aplica a todos los tenants
2. **Operacionalmente simple** — una sola instancia de PostgreSQL para todos
3. **Escala bien** para miles de tenants (con índices adecuados en `tenantId`)
4. **Queries cross-tenant** posibles para el super admin
5. **Tiempo de onboarding instantáneo** — no hay que crear schemas/databases por cada nuevo tenant

## Medidas de seguridad adicionales

Para que el row-level no sea solo "confiamos en la app":

1. **TenantGuard** en NestJS — obligatorio en todos los controllers, no se puede bypassear
2. **Prisma middleware** global que agrega `tenantId` a todos los queries automáticamente
3. **Tests de aislamiento** — suite dedicada que verifica que tenant A no puede ver datos de tenant B
4. **PostgreSQL Row-Level Security (RLS)** — capa adicional a nivel de DB como backstop

## Plan de migración a schema-per-tenant

Si un tenant Enterprise lo requiere:
1. Exportar sus datos del schema compartido
2. Crear un schema dedicado `tenant_{id}`
3. Importar datos
4. Actualizar `TenantChannel.dbSchema` para que el ORM sepa dónde conectarse
5. El resto del código no cambia — la abstracción del Prisma client lo maneja

## Consecuencias

- Todos los modelos tienen `tenantId` — disciplina de equipo para no olvidarlo
- Los índices en `tenantId` son críticos para performance — revisión en cada migración
- Un bug en el middleware podría filtrar datos entre tenants — mitigado con RLS en PG

## Alternativas descartadas

| Estrategia | Por qué no |
|---|---|
| Schema-per-tenant | N migraciones al deploy, difícil de operar con >50 tenants |
| Database-per-tenant | Costo de infra prohibitivo, conexiones de PG se agotan |
| Hybrid (row para pequeños, schema para grandes) | Complejidad innecesaria en fase 1 |
