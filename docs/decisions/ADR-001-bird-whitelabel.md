# ADR-001 — Bird como proveedor WhatsApp (whitelabel)

**Estado:** Aceptado
**Fecha:** Marzo 2026

## Contexto

Necesitamos un proveedor de WhatsApp Business API que permita operar como whitelabel multi-tenant, donde cada uno de nuestros clientes tenga su propio número de WhatsApp y WABA, y donde nosotros gestionemos todo desde nuestra plataforma sin exponer al proveedor al usuario final.

## Decisión

Usamos **Bird (ex-MessageBird)** como proveedor de WhatsApp Business API.

Cada tenant tiene su propio **Bird Workspace** con sus credenciales independientes. Nosotros almacenamos esas credenciales cifradas y las usamos en nombre del tenant para cada operación.

## Razones

1. **Workspaces multi-tenant nativos** — Bird soporta múltiples workspaces por organización, lo que mapea perfectamente a nuestros tenants
2. **API REST limpia** — bien documentada, con webhooks robustos para inbound + delivery status
3. **Soporte WhatsApp + SMS + Email** — podemos expandir canales en el futuro sin cambiar de proveedor
4. **Template management API** — podemos crear y monitorear templates programáticamente, sincronizando con Meta
5. **Escala** — Bird maneja millones de mensajes, es usado por empresas Fortune 500

## Consecuencias

- Cada tenant debe crear su cuenta Bird y proporcionar sus credenciales (proceso de onboarding guiado)
- Tenemos dependencia de Bird como vendor — mitigación: abstraer todo en `packages/bird-client` para facilitar migración futura
- Los límites de Meta (tiers de WABA) aplican por tenant — documentamos esto claramente
- Costos de Bird van al costo base del tenant o lo pasan ellos directamente

## Alternativas descartadas

| Proveedor | Por qué no |
|---|---|
| Twilio | Más caro, interfaz menos amigable para templates |
| 360dialog | Menos funcional, comunidad más pequeña |
| Meta Cloud API directa | Requiere que nosotros manejemos toda la infraestructura de Meta, mayor complejidad |
| Vonage | Sin ventaja clara sobre Bird para este caso |
