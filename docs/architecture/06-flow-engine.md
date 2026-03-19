# 06 — Motor de Flujos (Flow Engine)

## Concepto

Un **Flow** es un grafo dirigido (DAG) que define cómo responde el sistema a la interacción de un contacto. Cada nodo es una acción o decisión. Cada edge es una transición entre nodos, con condiciones opcionales.

```
[Template enviado]
       │
       ▼
[wait_response: 24h]
       │
   ┌───┴────────────────────┐
   │ respuesta recibida      │ no respondió
   ▼                         ▼
[condition]              [send_message: "¿Necesitas más tiempo?"]
   │ contiene "sí"
   ▼
[send_message: "Gracias, procesamos tu pago"]
   │
   ▼
[end]
```

---

## Tipos de nodos

### `trigger` — Nodo de entrada
Siempre uno por flujo. Se activa cuando se envía la plantilla de campaña.

```json
{
  "type": "trigger",
  "id": "node_1",
  "config": {
    "label": "Campaña iniciada"
  }
}
```

### `send_message` — Enviar mensaje
Envía un mensaje al contacto (texto libre, media, o template).

```json
{
  "type": "send_message",
  "id": "node_2",
  "config": {
    "messageType": "text",
    "content": "Hola {{contact.name}}, tu pago de ${{context.amount}} está pendiente."
  }
}
```

### `wait_response` — Esperar respuesta
Pausa el flujo hasta que el contacto responda. Tiene timeout configurable.

```json
{
  "type": "wait_response",
  "id": "node_3",
  "config": {
    "timeoutHours": 24,
    "timeoutNodeId": "node_timeout",  // a dónde va si no responde
    "saveAs": "user_reply"            // guarda la respuesta en context
  }
}
```

### `condition` — Bifurcación condicional
Evalúa una expresión y elige el edge de salida.

```json
{
  "type": "condition",
  "id": "node_4",
  "config": {
    "rules": [
      {
        "expression": "context.user_reply.toLowerCase().includes('si')",
        "targetNodeId": "node_5"
      },
      {
        "expression": "context.user_reply.toLowerCase().includes('no')",
        "targetNodeId": "node_6"
      }
    ],
    "defaultNodeId": "node_7"  // si ninguna condición aplica
  }
}
```

### `delay` — Espera programada
Espera un tiempo fijo antes de continuar (ej: recordatorio a las 8am).

```json
{
  "type": "delay",
  "id": "node_8",
  "config": {
    "delayMinutes": 60,
    "scheduledTime": "08:00",  // opcional: esperar hasta hora específica
    "timezone": "America/Mexico_City"
  }
}
```

### `webhook_call` — Llamar API externa
Llama a un endpoint HTTP del cliente (ej: marcar pago como procesado).

```json
{
  "type": "webhook_call",
  "id": "node_9",
  "config": {
    "url": "https://erp.cliente.com/api/payments/confirm",
    "method": "POST",
    "headers": { "Authorization": "Bearer {{tenant.webhookToken}}" },
    "body": { "contactPhone": "{{contact.phone}}", "reply": "{{context.user_reply}}" },
    "saveResponseAs": "erp_response"
  }
}
```

### `assign_tag` — Etiquetar contacto
Agrega un tag al contacto para segmentación futura.

```json
{
  "type": "assign_tag",
  "id": "node_10",
  "config": {
    "tags": ["interesado", "cobro_pendiente"]
  }
}
```

### `end` — Fin del flujo
Cierra la ejecución y opcionalmente la conversación.

```json
{
  "type": "end",
  "id": "node_11",
  "config": {
    "closeConversation": true,
    "finalTag": "flujo_completado"
  }
}
```

---

## Estructura de un Edge

```json
{
  "id": "edge_1",
  "source": "node_3",
  "target": "node_4",
  "label": "respondió"
}
```

---

## Context del flujo

Cada ejecución tiene un objeto `context` mutable que todos los nodos pueden leer y escribir:

```json
{
  "contact": {
    "phone": "+521234567890",
    "name": "Juan Pérez",
    "metadata": { "deuda": 5000 }
  },
  "campaign": {
    "id": "camp_123",
    "name": "Cobros Enero"
  },
  "user_reply": "Sí, quiero pagar",
  "erp_response": { "status": "confirmed" }
}
```

---

## Ejecución del Motor

```typescript
// packages/flow-engine/src/engine.ts

class FlowEngine {
  async executeNode(execution: FlowExecution, inboundMessage?: string): Promise<void> {
    const node = this.getNode(execution.flowId, execution.currentNodeId);
    const handler = this.nodeHandlers[node.type];

    const result = await handler.execute(node.config, execution.context, inboundMessage);

    if (result.nextNodeId) {
      await this.transitionTo(execution, result.nextNodeId, result.updatedContext);
    } else if (result.waitForResponse) {
      // queda en estado WAITING — se reanuda cuando llega webhook inbound
      await this.setWaiting(execution, result.updatedContext);
    } else {
      await this.complete(execution);
    }
  }
}
```

---

## Estado de ejecución en Redis

Para flujos con `wait_response`, el estado se guarda en Redis para acceso ultrarrápido:

```
Key: flow:exec:{tenantId}:{conversationId}
Value: {
  "executionId": "exec_abc",
  "flowId": "flow_xyz",
  "currentNodeId": "node_3",
  "status": "WAITING",
  "context": {...},
  "waitingForResponseSince": "2026-03-19T10:00:00Z"
}
TTL: 48h (limpieza de flujos que nunca terminan)
```

Cuando llega un mensaje inbound, el webhook processor:
1. Busca en Redis `flow:exec:{tenantId}:{phone}` → encuentra el nodo `wait_response`
2. Publica job en BullMQ para que el Flow Engine continúe
3. El motor retoma desde ese nodo con el mensaje como input

---

## Validación de flujo al activar

Antes de activar un flujo, el API valida:
- Existe exactamente un nodo `trigger`
- Todos los edges apuntan a nodos existentes
- No hay nodos huérfanos (sin entrada ni salida, excepto `trigger` y `end`)
- Los `condition` tienen al menos un `defaultNodeId`
- Los `wait_response` tienen `timeoutNodeId` definido
