# 09 — Infraestructura y Deployment

## Entornos

| Entorno | Stack | Propósito |
|---|---|---|
| **local** | Docker Compose | Desarrollo local completo |
| **staging** | Kubernetes (namespace staging) | QA y validación |
| **production** | Kubernetes (namespace prod) | Producción |

---

## Docker Compose (local)

```yaml
# infra/docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: wa_campaigns
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    ports: ["9092:9092"]
    environment:
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_NODE_ID: 1
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"

  clickhouse:
    image: clickhouse/clickhouse-server:24-alpine
    ports: ["8123:8123", "9000:9000"]

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    ports: ["8080:8080"]
    environment:
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
```

---

## Kubernetes (Producción)

### Deployments

```
Namespace: wa-campaigns-prod
│
├── Deployment: api
│   ├── replicas: 3 (HPA: min 3, max 10)
│   ├── resources: 512Mi RAM, 0.5 CPU
│   └── image: ghcr.io/org/wa-api:${VERSION}
│
├── Deployment: worker
│   ├── replicas: 4 (HPA: min 4, max 20 — escala por kafka lag)
│   ├── resources: 1Gi RAM, 1 CPU
│   └── image: ghcr.io/org/wa-worker:${VERSION}
│
├── Deployment: web
│   ├── replicas: 2 (HPA: min 2, max 8)
│   ├── resources: 256Mi RAM, 0.25 CPU
│   └── image: ghcr.io/org/wa-web:${VERSION}
│
├── StatefulSet: postgres (o managed: Cloud SQL / RDS)
├── StatefulSet: redis (o managed: Redis Cloud)
├── StatefulSet: kafka (o managed: Confluent Cloud)
└── StatefulSet: clickhouse (o managed: ClickHouse Cloud)
```

### Ingress

```
*.waplatform.com → wildcard TLS (cert-manager + Let's Encrypt)
  ├── acme.waplatform.com     → web deployment (tenant: acme)
  ├── api.waplatform.com      → api deployment
  └── app.waplatform.com      → web deployment (default)
```

### HPA para Worker (escala por Kafka lag)

```yaml
# El worker escala automáticamente cuando el lag de Kafka crece
# KEDA (Kubernetes Event Driven Autoscaler) lo maneja
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: worker-scaler
spec:
  scaleTargetRef:
    name: worker
  minReplicaCount: 4
  maxReplicaCount: 20
  triggers:
    - type: kafka
      metadata:
        topic: campaign.dispatch
        bootstrapServers: kafka:9092
        consumerGroup: wa-worker-group
        lagThreshold: "500"   # escala cuando hay >500 msgs sin procesar
```

---

## CI/CD (GitHub Actions)

```
Push a main:
  1. Lint + TypeScript check (Turborepo cache)
  2. Tests (unit + integration)
  3. Build Docker images
  4. Push a GHCR
  5. Deploy a staging automáticamente
  6. Smoke tests en staging

Tag v*.*.*:
  1. Deploy a producción (con aprobación manual)
  2. Prisma migrate deploy
  3. Notificación en Slack
```

---

## Variables de entorno

```bash
# API + Worker
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
KAFKA_BROKERS=kafka:9092
CLICKHOUSE_URL=http://clickhouse:8123
ENCRYPTION_KEY=32-bytes-hex          # para cifrar credenciales Bird
CLERK_SECRET_KEY=...
BIRD_WEBHOOK_SECRET=...              # para verificar firma de webhooks Bird

# Web
NEXT_PUBLIC_API_URL=https://api.waplatform.com
NEXT_PUBLIC_WS_URL=wss://api.waplatform.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

---

## Costos estimados (producción media)

| Servicio | Opción managed | Costo aprox/mes |
|---|---|---|
| PostgreSQL | Cloud SQL (2vCPU, 8GB) | $150 |
| Redis | Redis Cloud (1GB) | $50 |
| Kafka | Confluent Cloud (básico) | $200 |
| ClickHouse | ClickHouse Cloud (dev) | $100 |
| Kubernetes | GKE Autopilot | $200-500 |
| **Total base** | | **~$700-1000** |

Esto soporta múltiples tenants activos con varios millones de mensajes/mes. Escala linealmente con el uso.
