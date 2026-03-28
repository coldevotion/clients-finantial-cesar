# Cobrix — Plataforma de Cobranza

Plataforma B2B SaaS para gestión inteligente de cobranza y recuperación de cartera mediante campañas masivas por WhatsApp, flujos automatizados y seguimiento de conversaciones.

---

## Levantar el proyecto

### Requisitos previos

| Herramienta | Versión mínima |
|-------------|----------------|
| Node.js     | 20+            |
| pnpm        | 9+             |
| Docker      | 24+ (para infra local) |

### 1. Clonar y configurar variables de entorno

```bash
git clone <repo-url>
cd clients-finantial-cesar

# Copiar el ejemplo y completar los valores reales
cp .env.example .env
```

Edita `.env` con tus valores (ver sección [Variables de entorno](#variables-de-entorno) abajo).

### 2. Instalar dependencias y generar cliente Prisma

```bash
pnpm setup
```

Este comando ejecuta `pnpm install` + `pnpm db:generate` en un solo paso.

### 3. Levantar infraestructura (Redis, PostgreSQL, ClickHouse)

```bash
pnpm infra:up
```

> Si usas servicios externos (DB y Redis remotos) puedes omitir este paso y apuntar directamente en `.env`.

### 4. Crear tablas en la base de datos

```bash
# Primera vez — aplica las migraciones
pnpm db:migrate

# O si prefieres sincronizar el schema directamente (dev sin historial de migraciones)
pnpm db:push
```

### 5. Crear el primer usuario administrador

```bash
pnpm db:seed
```

Crea el `SUPER_ADMIN` y el tenant inicial con las credenciales definidas en `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` del `.env`.

### 6. Levantar frontend + backend juntos

```bash
pnpm dev:local
```

| Servicio   | URL                   |
|------------|-----------------------|
| Frontend   | http://localhost:3000 |
| API REST   | http://localhost:3001 |

---

## Variables de entorno

Copia `.env.example` → `.env` y completa cada sección. **Nunca subas `.env` a git.**

### Base de datos (PostgreSQL)

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB

# Solo necesario si usas el docker-compose local
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password_seguro
```

### Redis

```env
# Sin password:
REDIS_URL=redis://localhost:6379

# Con password:
REDIS_URL=redis://:tu_password@host:6380/0
REDIS_PASSWORD=tu_password
```

### Seguridad — JWT y cifrado

```bash
# Generar valores seguros:
openssl rand -hex 32   # → ENCRYPTION_KEY
openssl rand -hex 64   # → JWT_SECRET
openssl rand -hex 64   # → JWT_REFRESH_SECRET
```

```env
ENCRYPTION_KEY=<32 bytes hex>
JWT_SECRET=<64 bytes hex>
JWT_REFRESH_SECRET=<64 bytes hex>
```

### Email / SMTP

Compatible con Gmail, Resend, Mailgun, Postmark, Brevo, AWS SES, etc.

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu@email.com
SMTP_PASS=tu_smtp_password
MAIL_FROM_NAME=Cobrix
MAIL_FROM_ADDRESS=noreply@tudominio.com
```

### WhatsApp (Bird)

```env
BIRD_WEBHOOK_SECRET=tu_webhook_secret_de_bird
```

### API

```env
PORT=3001
NODE_ENV=development
WEB_URL=http://localhost:3000
```

### Frontend (Next.js)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Modo mock — respuestas simuladas sin backend real
NEXT_PUBLIC_MOCK_MODE=false
```

> **Desarrollo local:** crea `apps/web/.env.local` para overrides que no van a git:
> ```env
> # Ver JSON plano en Network inspector (sin cifrado ECDH)
> NEXT_PUBLIC_DISABLE_CRYPTO=true
> ```

### Seed (primer arranque)

```env
SEED_ADMIN_EMAIL=admin@cobrix.com
SEED_ADMIN_PASSWORD=contraseña_super_segura
SEED_TENANT_NAME=Cobrix
SEED_TENANT_SLUG=cobrix
```

### Kafka / ClickHouse (opcionales)

```env
# Kafka — usado para eventos de alto volumen
KAFKA_BROKERS=localhost:9092
KAFKA_GROUP_ID=cobrix-worker

# ClickHouse — analíticas avanzadas
CLICKHOUSE_URL=http://localhost:8123
CLICKHOUSE_DB=wa_analytics
CLICKHOUSE_PASSWORD=
```

---

## Comandos disponibles

### Desarrollo

```bash
pnpm setup          # Instalar deps + generar Prisma (primera vez)
pnpm dev:local      # Frontend + API en paralelo (hot-reload)
```

### Base de datos

```bash
pnpm db:generate    # Regenerar cliente Prisma tras cambios en schema
pnpm db:push        # Sincronizar schema con la DB (dev, sin migraciones)
pnpm db:migrate     # Aplicar migraciones pendientes (producción)
pnpm db:migrate:dev # Crear nueva migración (desarrollo)
pnpm db:seed        # Crear SUPER_ADMIN + tenant inicial
pnpm db:studio      # Abrir Prisma Studio (GUI de la DB)
```

### Infraestructura

```bash
pnpm infra:up       # Levantar Docker (Redis, PostgreSQL, ClickHouse)
pnpm infra:down     # Detener contenedores
```

### Build y calidad

```bash
pnpm build          # Build de producción (todos los apps)
pnpm lint           # Linter en todos los packages
pnpm test           # Tests en todos los packages
```

---

## Arquitectura

```
clients-finantial-cesar/
├── apps/
│   ├── api/          # NestJS — API REST + WebSockets
│   └── web/          # Next.js 15 — Frontend
├── packages/
│   ├── database/     # Prisma schema + migraciones + seed
│   ├── types/        # Tipos TypeScript compartidos
│   └── bird-client/  # Cliente HTTP para la API de Bird (WhatsApp)
└── infra/
    └── docker-compose.yml
```

### Stack

| Capa        | Tecnología                                     |
|-------------|------------------------------------------------|
| Frontend    | Next.js 15, React 19, Tailwind CSS, Zustand, React Query |
| Backend     | NestJS 10, Passport JWT, BullMQ                |
| Base datos  | PostgreSQL + Prisma ORM                        |
| Colas       | Redis + BullMQ                                 |
| Analíticas  | ClickHouse (opcional)                          |
| Mensajería  | Bird API (WhatsApp Business)                   |
| Seguridad   | ECDH P-256 + AES-256-GCM (cifrado en tránsito) |

### Módulos del API

| Módulo          | Descripción                                         |
|-----------------|-----------------------------------------------------|
| `auth`          | Login, registro, JWT, refresh, 2FA, cambio de clave |
| `users`         | Gestión de usuarios por tenant                      |
| `tenants`       | Multi-tenancy — clientes de la plataforma           |
| `templates`     | Plantillas HSM de WhatsApp                          |
| `flows`         | Flujos de conversación automatizados                |
| `campaigns`     | Campañas masivas con scheduling y segmentación      |
| `contacts`      | Gestión de contactos y listas                       |
| `bulk-uploads`  | Carga masiva de contactos vía CSV                   |
| `conversations` | Bandeja de conversaciones entrantes                 |
| `analytics`     | Métricas de campañas y dashboard                    |
| `webhooks`      | Recepción de eventos desde Bird                     |
| `logs`          | Registro de actividad del sistema                   |
| `crypto`        | Handshake ECDH + cifrado de payloads HTTP           |

---

## Flujo de trabajo — Prisma

Cuando necesitas cambiar el schema de la base de datos:

```bash
# 1. Editar packages/database/prisma/schema.prisma
# 2. Crear la migración
pnpm db:migrate:dev

# 3. Regenerar el cliente TypeScript
pnpm db:generate

# 4. El API y los packages ya tienen los nuevos tipos disponibles
```

---

## Seguridad

- Los payloads HTTP entre frontend y API viajan cifrados con **ECDH P-256 + AES-256-GCM**
- Las claves se negocian en cada sesión del navegador (nunca se transmiten)
- Para desarrollo local, desactiva el cifrado con `NEXT_PUBLIC_DISABLE_CRYPTO=true` en `apps/web/.env.local`
- Los tokens JWT tienen vida corta (15 min access, 7 días refresh)
- Rate limiting: 300 req/min por IP

---

## Roles de usuario

| Rol               | Acceso                                           |
|-------------------|--------------------------------------------------|
| `SUPER_ADMIN`     | Acceso total — gestión de clientes y sistema     |
| `TENANT_ADMIN`    | Administración completa de su tenant             |
| `TENANT_OPERATOR` | Operaciones del día a día (campañas, contactos)  |
