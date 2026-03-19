# ADR-002 — Kafka para pipeline de mensajería a escala

**Estado:** Aceptado
**Fecha:** Marzo 2026

## Contexto

El sistema debe soportar campañas de millones de mensajes. Necesitamos una cola que soporte:
- Publicar millones de mensajes en ráfagas (al lanzar una campaña grande)
- Consumirlos en paralelo con múltiples workers
- Garantizar que ningún mensaje se pierda ni se procese dos veces
- Escalar horizontalmente los consumidores según la carga

## Decisión

Usamos **Apache Kafka** para el topic `campaign.dispatch` (el pipeline de envíos masivos).

Usamos **BullMQ** (sobre Redis) para jobs más pequeños: webhooks inbound, flow transitions, retries, delayed jobs.

## Razones para Kafka (y no solo BullMQ)

| Criterio | BullMQ | Kafka |
|---|---|---|
| Throughput | ~50k msgs/s | ~1M msgs/s |
| Retención de mensajes | Ephemeral (se borran al procesar) | Configurable (días) |
| Replay de mensajes | No | Sí (desde offset) |
| Particionamiento | No (una queue) | Sí (16 partitions) |
| Escala de consumers | Limitada por Redis | Horizontal ilimitada |
| Complejidad operacional | Baja | Media |

Para el volumen de millones de mensajes, Kafka es la opción correcta. BullMQ es excelente para el resto de jobs que son de menor volumen pero requieren features como delays y prioridades.

## Razones para mantener BullMQ también

- Los webhooks inbound de Bird son eventos pequeños y frecuentes — BullMQ es más simple aquí
- Los nodos `delay` del Flow Engine necesitan jobs programados — BullMQ `delayed jobs` es perfecto
- Los retries de mensajes fallidos con backoff exponencial — BullMQ lo maneja nativamente
- No queremos Kafka para todo: agrega latencia innecesaria en flows conversacionales

## Consecuencias

- Necesitamos operar Kafka (o usar Confluent Cloud en producción)
- Los developers deben entender el modelo de offsets/consumer groups de Kafka
- La abstracción en `apps/worker/src/consumers/` oculta la complejidad de Kafka del resto del código
- En producción: Confluent Cloud elimina la operación manual de Kafka

## Alternativas descartadas

| Alternativa | Por qué no |
|---|---|
| Solo BullMQ | No escala a millones, Redis como broker tiene límites de memoria |
| RabbitMQ | Menor throughput, peor para replay y particionamiento |
| AWS SQS/SNS | Vendor lock-in AWS, latencia mayor, más caro a escala |
| Pub/Sub de GCP | Idem, vendor lock-in GCP |
