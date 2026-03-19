# Deployment en Coolify

## Estrategia

Usamos **Docker Compose** en Coolify apuntando a `infra/coolify-compose.yml`.
Esto levanta toda la stack (api + worker + web + infra) en un solo recurso.

---

## Paso a paso

### 1. Conectar el repositorio en Coolify

1. En Coolify → New Resource → **Docker Compose**
2. Seleccionar el repositorio de GitHub
3. En **Docker Compose Location**: `infra/coolify-compose.yml`
4. En **Build Context**: `/` (raíz del repo)

### 2. Variables de entorno

En Coolify → Environment Variables, agregar todas:

```bash
# Database
POSTGRES_USER=wauser
POSTGRES_PASSWORD=<password-fuerte>

# Redis
REDIS_PASSWORD=<password-fuerte>

# Seguridad (CRÍTICO: genera uno nuevo)
# openssl rand -hex 32
ENCRYPTION_KEY=<64-char-hex>

# Clerk
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...

# Bird
BIRD_WEBHOOK_SECRET=<secret>

# URLs públicas (dominio de Coolify)
API_URL=https://api.tudominio.com
WS_URL=wss://api.tudominio.com
WEB_URL=https://app.tudominio.com
```

### 3. Dominios en Coolify

Configurar en Coolify los dominios para cada servicio:

| Servicio | Puerto | Dominio sugerido |
|---|---|---|
| `web` | 3000 | `app.tudominio.com` |
| `api` | 3001 | `api.tudominio.com` |

Coolify maneja SSL automáticamente con Let's Encrypt.

### 4. Deploy

Click **Deploy** en Coolify. Los builds de Docker toman ~5-8 minutos la primera vez (descarga de imágenes base + compilación TypeScript).

### 5. Migraciones (primera vez)

Después del primer deploy exitoso, ejecutar en Coolify → Terminal del servicio `api`:

```bash
node node_modules/.bin/prisma migrate deploy
```

O agregar como **Deploy Command** en Coolify: `node node_modules/.bin/prisma migrate deploy && node dist/main`

---

## Escalar workers

Para campañas de alto volumen, aumentar réplicas del worker en `coolify-compose.yml`:

```yaml
worker:
  deploy:
    replicas: 4  # de 2 a 4 según carga
```

---

## Alternativa para Kafka: Confluent Cloud (recomendado para producción seria)

Si el servidor tiene recursos limitados, Kafka consume ~512MB RAM.
**Confluent Cloud** tiene free tier (10GB/mes gratis):

1. Crear cuenta en confluent.io
2. Crear un cluster en free tier
3. Copiar el Bootstrap Server y API Key
4. En `coolify-compose.yml`, eliminar los servicios `kafka` y `zookeeper`
5. Cambiar en los servicios:

```yaml
KAFKA_BROKERS: pkc-xxxxx.us-east1.gcp.confluent.cloud:9092
KAFKA_SASL_USERNAME: <api-key>
KAFKA_SASL_PASSWORD: <api-secret>
```

---

## Requisitos mínimos del servidor

| Configuración | RAM | CPU | Disco |
|---|---|---|---|
| Mínima (sin Kafka local) | 2 GB | 2 vCPU | 20 GB |
| Recomendada (con Kafka) | 4 GB | 2 vCPU | 40 GB |
| Para escala | 8 GB | 4 vCPU | 80 GB |

---

## Actualizar la app (redeploy)

Cada push a `main` puede disparar un redeploy automático.
En Coolify → Webhooks → activar GitHub webhook para auto-deploy.
