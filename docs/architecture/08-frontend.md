# 08 — Frontend y Flow Builder

## Stack Frontend

| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 15 (App Router) | Framework principal, SSR, Server Actions |
| React | 19 | UI |
| TypeScript | 5 | Tipado compartido con el monorepo |
| shadcn/ui | latest | Componentes base |
| Tailwind CSS | 4 | Estilos utilitarios |
| React Flow | 12 | Canvas del Flow Builder |
| Zustand | 5 | Estado global (flow builder, sesión) |
| TanStack Query | 5 | Data fetching, cache, optimistic updates |
| TanStack Table | 8 | Tablas de contactos, campañas, mensajes |
| Recharts | 2 | Gráficas de analytics |
| Socket.io client | 4 | WebSocket para conversaciones en tiempo real |
| Clerk | latest | Auth multi-tenant, organizaciones |

> **Nota de diseño:** Todo el sistema visual se diseña usando la skill `ui-ux-pro-max`. El código de componentes debe respetar el design system generado por esa skill antes de implementar.

---

## Estructura de rutas (App Router)

```
app/
├── (auth)/
│   ├── login/
│   ├── register/
│   └── onboarding/         ← setup inicial del tenant (conectar Bird)
│
├── (dashboard)/
│   ├── layout.tsx           ← sidebar, navbar, tenant context
│   │
│   ├── page.tsx             ← Dashboard home (métricas rápidas)
│   │
│   ├── templates/
│   │   ├── page.tsx         ← Lista de templates
│   │   ├── new/page.tsx     ← Crear template
│   │   └── [id]/page.tsx   ← Detalle + status de aprobación
│   │
│   ├── flows/
│   │   ├── page.tsx         ← Lista de flujos
│   │   └── [id]/
│   │       ├── page.tsx     ← Flow Builder (canvas principal)
│   │       └── stats/page.tsx ← Estadísticas del flujo
│   │
│   ├── campaigns/
│   │   ├── page.tsx         ← Lista + filtros
│   │   ├── new/page.tsx     ← Crear campaña (stepper)
│   │   └── [id]/
│   │       ├── page.tsx     ← Detalle + progress en tiempo real
│   │       └── report/page.tsx ← Reporte completo
│   │
│   ├── contacts/
│   │   ├── page.tsx         ← Lista de contactos
│   │   ├── import/page.tsx  ← Importar CSV
│   │   └── lists/page.tsx   ← Gestión de listas
│   │
│   ├── conversations/
│   │   ├── page.tsx         ← Inbox de conversaciones
│   │   └── [id]/page.tsx   ← Chat view con historial
│   │
│   └── analytics/
│       └── page.tsx         ← Reportes generales
│
└── (admin)/                 ← Super admin (nosotros)
    ├── tenants/
    ├── billing/
    └── system/
```

---

## Flow Builder — Detalle técnico

El Flow Builder es la pantalla central del producto. Usa **React Flow** como base.

### Componentes custom

```
components/flow-builder/
├── FlowCanvas.tsx           ← wrapper principal de React Flow
├── FlowToolbar.tsx          ← barra superior (save, activate, test)
├── FlowSidebar.tsx          ← panel izquierdo con nodos arrastrables
├── FlowMinimap.tsx          ← minimapa de navegación
│
├── nodes/
│   ├── TriggerNode.tsx
│   ├── SendMessageNode.tsx
│   ├── WaitResponseNode.tsx
│   ├── ConditionNode.tsx
│   ├── DelayNode.tsx
│   ├── WebhookCallNode.tsx
│   ├── AssignTagNode.tsx
│   └── EndNode.tsx
│
├── panels/
│   ├── NodeConfigPanel.tsx  ← panel derecho: config del nodo seleccionado
│   ├── FlowSettingsPanel.tsx
│   └── TestPanel.tsx        ← simular flujo con número propio
│
└── edges/
    └── ConditionalEdge.tsx  ← edge con label de condición
```

### Estado del Flow Builder (Zustand)

```typescript
interface FlowBuilderStore {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNodeId: string | null;
  isDirty: boolean;           // cambios sin guardar
  isSaving: boolean;

  // Actions
  addNode: (type: NodeType, position: XYPosition) => void;
  updateNodeConfig: (nodeId: string, config: Partial<NodeConfig>) => void;
  removeNode: (nodeId: string) => void;
  connectNodes: (edge: FlowEdge) => void;
  saveFlow: () => Promise<void>;   // PUT /api/flows/:id/graph
  activateFlow: () => Promise<void>;
}
```

### Auto-save
El flow se guarda automáticamente cada 3 segundos si hay cambios (`isDirty = true`). Feedback visual con indicador "Guardado" / "Guardando..." / "Error al guardar".

---

## Conversaciones — Chat View

Vista de tipo WhatsApp Web con:
- Mensajes inbound (burbujas izquierda)
- Mensajes outbound (burbujas derecha)
- Status de cada mensaje (enviado / entregado / leído / fallido)
- Indicador del nodo actual del flujo en la conversación
- Botón para intervención manual (responder fuera del flujo)
- Timeline de eventos del flujo (nodos ejecutados)

Actualización en tiempo real vía **Socket.io** — cuando llega un mensaje inbound, se agrega a la lista sin recargar.

---

## Multi-tenant routing (Next.js Middleware)

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  const subdomain = hostname?.split('.')[0];

  // acme.waplatform.com → tenantSlug = "acme"
  // Inyecta tenantSlug en header para que Server Components lo lean
  const response = NextResponse.next();
  response.headers.set('x-tenant-slug', subdomain ?? '');
  return response;
}
```

---

## Consideraciones de diseño (ui-ux-pro-max)

Antes de implementar cualquier pantalla nueva:
1. Usar la skill `ui-ux-pro-max` para generar wireframes/componentes
2. El design system resultante se almacena en `packages/ui/`
3. Colores, tipografía y espaciado deben ser consistentes con el brandbook del whitelabel
4. Cada tenant puede tener su propio logo y color primario (theming por tenant)
