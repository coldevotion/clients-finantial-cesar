# Integración Bird API (WhatsApp Provider)

## Qué es Bird

Bird (ex-MessageBird) es el proveedor de WhatsApp Business API que usamos como capa de abstracción hacia Meta. Nosotros somos whitelabel sobre Bird — nuestros clientes nunca saben que Bird existe.

**Docs oficiales:** https://docs.bird.com

---

## Modelo de integración multi-tenant

```
Nuestra plataforma
  └── Tenant A
        └── Bird Workspace A  (bird_workspace_id_A + bird_api_key_A)
              └── WhatsApp Channel → WABA_A → Número +52 111...

  └── Tenant B
        └── Bird Workspace B  (bird_workspace_id_B + bird_api_key_B)
              └── WhatsApp Channel → WABA_B → Número +52 222...
```

Cada tenant tiene su propio **Bird Workspace** con sus propias credenciales. Esto garantiza:
- Aislamiento total de datos entre tenants
- Billing por separado si se requiere
- Límites de rate de WhatsApp independientes
- Números de WhatsApp propios por tenant

---

## Configuración inicial de un tenant (Onboarding)

1. Tenant crea cuenta en Bird y genera un Workspace
2. En Bird: crea un WhatsApp Channel (conecta WABA con Meta)
3. En nuestro dashboard: va a Settings → Canal WhatsApp → ingresa:
   - Bird Workspace ID
   - Bird API Key
   - Bird Channel ID
   - Número de WhatsApp (E.164)
4. Nuestro sistema guarda las credenciales cifradas en `TenantChannel`
5. Registra nuestro webhook URL en Bird:
   `POST https://api.bird.com/workspaces/{workspaceId}/webhooks`

---

## Endpoints Bird que usamos

### Enviar mensaje (template)

```
POST https://api.bird.com/workspaces/{workspaceId}/channels/{channelId}/messages

Headers:
  Authorization: AccessKey {birdApiKey}
  Content-Type: application/json

Body:
{
  "receiver": {
    "contacts": [{ "identifierValue": "+521234567890" }]
  },
  "template": {
    "projectId": "{birdTemplateId}",
    "version": "latest",
    "locale": "es",
    "variables": {
      "body": [{ "key": "1", "value": "Juan" }, { "key": "2", "value": "$5,000" }]
    }
  }
}

Response:
{
  "id": "msg_bird_abc123",
  "status": "accepted"
}
```

### Enviar mensaje libre (dentro de ventana 24h)

```
POST https://api.bird.com/workspaces/{workspaceId}/channels/{channelId}/messages

Body:
{
  "receiver": {
    "contacts": [{ "identifierValue": "+521234567890" }]
  },
  "body": {
    "type": "text",
    "text": { "text": "Hola Juan, ¿cómo podemos ayudarte?" }
  }
}
```

### Gestión de templates

```
GET    /workspaces/{id}/message-templates          → listar templates
POST   /workspaces/{id}/message-templates          → crear template
GET    /workspaces/{id}/message-templates/{id}     → detalle + status (APPROVED/PENDING)
DELETE /workspaces/{id}/message-templates/{id}     → eliminar
```

---

## Webhooks entrantes de Bird

Bird envía eventos a nuestro endpoint:
`POST https://api.waplatform.com/webhooks/bird/{tenantId}`

### Evento: mensaje entregado

```json
{
  "type": "message.status.updated",
  "payload": {
    "id": "msg_bird_abc123",
    "status": "delivered",
    "channel": { "id": "ch_xyz" },
    "contact": { "identifierValue": "+521234567890" },
    "updatedAt": "2026-03-19T10:05:00Z"
  }
}
```

### Evento: mensaje leído

```json
{
  "type": "message.status.updated",
  "payload": {
    "id": "msg_bird_abc123",
    "status": "read",
    ...
  }
}
```

### Evento: mensaje inbound (respuesta del contacto)

```json
{
  "type": "message.created",
  "payload": {
    "id": "msg_inbound_xyz",
    "direction": "received",
    "body": {
      "type": "text",
      "text": { "text": "Sí, quiero pagar" }
    },
    "contact": { "identifierValue": "+521234567890" },
    "receivedAt": "2026-03-19T10:10:00Z"
  }
}
```

---

## Verificación de firma de webhooks

Bird firma cada webhook con HMAC-SHA256. Verificamos la firma antes de procesar:

```typescript
// packages/bird-client/src/webhooks.validator.ts

export function validateBirdWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signatureHeader)
  );
}
```

---

## Rate limits de Bird API

| Operación | Límite |
|---|---|
| API general | 5 req/segundo |
| Mensajes simultáneos | 5 concurrentes |
| WhatsApp Tier 1 | 1,000 usuarios únicos/día |
| WhatsApp Tier 2 | 10,000 usuarios únicos/día |
| WhatsApp Tier 3 | 100,000 usuarios únicos/día |

Nuestro `BirdRateLimiter` respeta estos límites usando Redis sliding window por tenant. Los tenants que alcanzan su límite diario reciben una alerta y la campaña se pausa hasta el día siguiente.

---

## Errores comunes de Bird

| Código | Significado | Acción |
|---|---|---|
| 429 | Rate limit | Retry con backoff |
| 400 | Template no aprobado o variables incorrectas | FAILED_PERMANENT |
| 404 | Channel no encontrado | Alerta al tenant admin |
| 131026 | Número no en WhatsApp | FAILED_PERMANENT, marcar contacto |
| 131047 | Fuera de ventana 24h sin template | Usar template |
