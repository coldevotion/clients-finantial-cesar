# 07 — Pipeline de Mensajería Masiva

## El problema de escala

WhatsApp tiene límites por tier de WABA:
- Tier 1: 1,000 contactos/día
- Tier 2: 10,000 contactos/día
- Tier 3: 100,000 contactos/día

Para envíos de millones, los tenants necesitan múltiples WABAs / números o tiempos de campaña distribuidos. El pipeline maneja esta complejidad de forma transparente.

---

## Arquitectura del pipeline

```
CampaignService.launch()
       │
       ▼
[1] Genera N MessageDispatch records en PostgreSQL
    (uno por contacto, status = PENDING)
       │
       ▼
[2] Publica evento en Kafka:
    Topic: campaign.dispatch
    Key: tenantId (garantiza orden por tenant)
    Value: { campaignId, batchId, dispatchIds[] }
       │
       ▼
[3] CampaignConsumer (Worker) — consume en paralelo
       │
       ├── Obtiene credenciales Bird del tenant (Redis cache)
       ├── Rate limiter por tenant (Redis sliding window)
       ├── Llama Bird API: POST /messages
       ├── Actualiza MessageDispatch → status = SENT
       └── Si error → BullMQ retry queue
       │
       ▼
[4] Bird entrega a WhatsApp
       │
       ▼
[5] Bird Webhook → POST /webhooks/bird/:tenantId
       │
       ▼
[6] WebhookConsumer (BullMQ)
       ├── status update (delivered/read/failed) → actualiza MessageDispatch + Campaign counters
       └── inbound message → busca FlowExecution en Redis → lanza FlowEngine job
```

---

## Kafka Topics

```
campaign.dispatch      → envíos pendientes (producido por API, consumido por Worker)
campaign.status        → actualizaciones de status de Bird (producido por webhook handler)
flow.execute           → ejecutar siguiente nodo de flujo (producido por webhook handler)
analytics.events       → todos los eventos para ClickHouse (producido por Worker)
```

### Configuración de particiones

```
campaign.dispatch:
  - partitions: 16 (escala horizontal de workers)
  - replication-factor: 3
  - retention: 7 días
  - key: tenantId (mensajes del mismo tenant van al mismo worker → respeta rate limit)
```

---

## Rate Limiting por Tenant (Redis)

```typescript
// Sliding window rate limiter
// Cada tenant tiene su propio límite según su tier de WABA

class BirdRateLimiter {
  async canSend(tenantId: string): Promise<boolean> {
    const key = `rate:bird:${tenantId}:${getCurrentSecond()}`;
    const count = await redis.incr(key);
    await redis.expire(key, 2);

    const tier = await this.getTenantTier(tenantId);
    const limit = TIER_LIMITS[tier]; // msgs por segundo

    return count <= limit;
  }
}

// Si no puede enviar → el consumer espera y reintenta
// Esto es manejado por el back-pressure de Kafka
```

---

## BullMQ Queues

```
webhook-processing    → procesar eventos inbound de Bird (prioridad alta)
flow-execution        → ejecutar nodos de flujo
campaign-retry        → reintentos de mensajes fallidos (backoff exponencial)
delay-jobs            → nodos "delay" del flow engine (scheduled jobs)
analytics-flush       → batching de eventos hacia ClickHouse
```

---

## Manejo de fallos

### Mensaje fallido en Bird API
```
1. Worker marca dispatch → FAILED con errorCode
2. Si es reintentable (429, 5xx) → BullMQ retry con backoff: 1s, 5s, 30s, 5min
3. Si es permanente (400, número inválido) → FAILED_PERMANENT, no retry
4. Contador de fallos actualiza Campaign.failed en tiempo real
```

### Worker cae a mitad de campaña
```
- Kafka offset no se comitea hasta que el mensaje se procesa exitosamente
- Al reiniciar, el worker retoma desde el último offset comiteado
- MessageDispatch con status PENDING son idempotentes → no se duplican
```

### Bird API caída total
```
- Circuit breaker en BirdClient (5 fallos en 30s → open circuit 60s)
- Campaign queda en PAUSED automáticamente
- Alerta enviada al tenant admin
- Al recuperarse, admin puede reanudar manualmente
```

---

## Estimación de throughput

Con 4 workers consumiendo Kafka y Bird Tier 3 (100k/día por WABA):

```
Si un tenant tiene 3 WABAs:
  → 300,000 mensajes/día
  → ~3.5 mensajes/segundo por tenant

Con 10 tenants activos simultáneamente:
  → 3,000,000 mensajes/día total en la plataforma
  → 35 mensajes/segundo

Para escalar más:
  → Más workers (escala horizontal en K8s)
  → Más WABAs por tenant (Bird lo soporta)
  → Más particiones en Kafka
```

---

## Monitoreo del pipeline

Métricas expuestas vía Prometheus + Grafana:
- `kafka_consumer_lag` por topic/partition
- `bird_api_latency_p99`
- `messages_sent_total` por tenant
- `messages_failed_total` por tenant + error_code
- `flow_executions_active` por tenant
- `bullmq_queue_depth` por queue
