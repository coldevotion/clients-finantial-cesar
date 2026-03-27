// ─── MOCK DATA para desarrollo sin backend ───────────────────────────────────
// Solo se usa cuando NEXT_PUBLIC_MOCK_MODE=true

export const MOCK_USER = {
  id: 'mock-user-1',
  email: 'demo@cobrix.com',
  name: 'Demo User',
  role: 'OWNER',
  tenantId: 'mock-tenant-1',
  twoFactorEnabled: false,
  isEmailVerified: true,
};

export const MOCK_RESPONSES: Record<string, unknown> = {
  // Auth
  'POST /auth/login': {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: MOCK_USER,
  },
  'GET /users/me': MOCK_USER,

  // Dashboard analytics
  'GET /analytics/dashboard': {
    totalCampaigns: 24,
    totalSent: 18_432,
    totalDelivered: 17_110,
    totalRead: 12_608,
    totalFailed: 320,
    openConversations: 127,
    totalContacts: 8_400,
  },

  // ─── Templates (HSM) ────────────────────────────────────────────────────────
  'GET /templates': [
    {
      id: 't1', name: 'cobros_atrasados', category: 'UTILITY', language: 'es', status: 'APPROVED',
      headerType: 'TEXT', headerText: '⚠️ Deuda pendiente',
      bodyText: 'Hola {{1}}, tienes una deuda de ${{2}} con vencimiento {{3}}. Contáctanos.',
      footerText: 'Provired Cobranzas',
      buttons: [{ type: 'QUICK_REPLY', text: 'Confirmar pago' }, { type: 'QUICK_REPLY', text: 'Hablar con asesor' }],
    },
    {
      id: 't2', name: 'bienvenida_cliente', category: 'MARKETING', language: 'es', status: 'APPROVED',
      headerType: 'IMAGE', imageUrl: 'https://placehold.co/600x300/267EF0/white?text=Bienvenido',
      bodyText: 'Bienvenido {{1}} a nuestros servicios. Estamos aquí para ayudarte.',
      footerText: 'Provired',
      buttons: [{ type: 'URL', text: 'Ver mi cuenta', url: 'https://app.cobrix.com' }],
    },
    {
      id: 't3', name: 'recordatorio_pago', category: 'UTILITY', language: 'es', status: 'PENDING',
      headerType: 'TEXT', headerText: 'Recordatorio de pago',
      bodyText: 'Tu cuota de ${{1}} vence el {{2}}. Evita recargos por mora.',
      footerText: null, buttons: [],
    },
    {
      id: 't4', name: 'confirmacion_cita', category: 'UTILITY', language: 'es', status: 'APPROVED',
      headerType: 'TEXT', headerText: 'Cita confirmada ✅',
      bodyText: 'Tu cita está programada para el {{1}} a las {{2}}.',
      footerText: 'Responde CANCELAR para reprogramar.',
      buttons: [{ type: 'QUICK_REPLY', text: 'Cancelar cita' }],
    },
    {
      id: 't5', name: 'promo_agosto', category: 'MARKETING', language: 'es', status: 'REJECTED',
      headerType: 'VIDEO', videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      bodyText: '¡Aprovecha el 20% de descuento en agosto! Solo hasta el 31.',
      footerText: 'Válido hasta 31-ago-2025',
      buttons: [{ type: 'URL', text: 'Ver oferta', url: 'https://cobrix.com/promo' }],
    },
  ],

  // ─── Flows ──────────────────────────────────────────────────────────────────
  'GET /flows': [
    { id: 'f1', name: 'flujo_cobros_01', status: 'ACTIVE', description: 'Flujo para gestión de cobros atrasados' },
    { id: 'f2', name: 'onboarding_nuevo_cliente', status: 'ACTIVE', description: 'Bienvenida y primeros pasos' },
    { id: 'f3', name: 'soporte_tecnico', status: 'DRAFT', description: 'Atención técnica automatizada' },
  ],

  // Flow detail with nodes (demo flow: cobros)
  'GET /flows/f1': {
    id: 'f1', name: 'flujo_cobros_01', status: 'ACTIVE',
    description: 'Flujo para gestión de cobros atrasados',
    nodes: [
      { id: 'n1', type: 'trigger',       position: { x: 320, y: 40  }, data: { label: 'Campaña cobros',      config: { type: 'campaign' } } },
      { id: 'n2', type: 'send_message',  position: { x: 320, y: 190 }, data: { label: 'Mensaje inicial',     config: { messageType: 'text', text: 'Hola {{contact.name}}, tienes una deuda pendiente. ¿Confirmas pago esta semana?' } } },
      { id: 'n3', type: 'wait_response', position: { x: 320, y: 380 }, data: { label: 'Esperar respuesta',   config: { timeoutHours: 24, saveAs: 'respuesta_cliente' } } },
      { id: 'n4', type: 'condition',     position: { x: 320, y: 540 }, data: { label: '¿Confirma pago?',     config: { variable: 'respuesta_cliente', operator: 'contains', value: 'sí' } } },
      { id: 'n5', type: 'send_message',  position: { x: 60,  y: 730 }, data: { label: 'Confirmar pago',      config: { messageType: 'text', text: '¡Perfecto! Puedes pagar en empresa.com/pagar' } } },
      { id: 'n6', type: 'delay',         position: { x: 580, y: 730 }, data: { label: 'Esperar 48h',         config: { delayMinutes: 2880 } } },
      { id: 'n7', type: 'end',           position: { x: 60,  y: 920 }, data: { label: 'Flujo completado' } },
      { id: 'n8', type: 'send_message',  position: { x: 580, y: 920 }, data: { label: 'Recordatorio final',  config: { messageType: 'text', text: 'Último aviso: tu deuda vence mañana. Contáctanos.' } } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', style: { stroke: '#267EF0', strokeWidth: 2 } },
      { id: 'e2', source: 'n2', target: 'n3', style: { stroke: '#267EF0', strokeWidth: 2 } },
      { id: 'e3', source: 'n3', target: 'n4', style: { stroke: '#267EF0', strokeWidth: 2 } },
      { id: 'e4', source: 'n4', target: 'n5', sourceHandle: 'true',  label: 'Sí', style: { stroke: '#10B981', strokeWidth: 2 }, labelStyle: { fill: '#10B981', fontWeight: 600, fontSize: 11 }, labelBgStyle: { fill: '#ECFDF5', borderRadius: 4 }, labelBgPadding: [4, 6] },
      { id: 'e5', source: 'n4', target: 'n6', sourceHandle: 'false', label: 'No', style: { stroke: '#EF4444', strokeWidth: 2 }, labelStyle: { fill: '#EF4444', fontWeight: 600, fontSize: 11 }, labelBgStyle: { fill: '#FEF2F2', borderRadius: 4 }, labelBgPadding: [4, 6] },
      { id: 'e6', source: 'n5', target: 'n7', style: { stroke: '#10B981', strokeWidth: 2 } },
      { id: 'e7', source: 'n6', target: 'n8', style: { stroke: '#EF4444', strokeWidth: 2 } },
    ],
  },
  'GET /flows/f2': {
    id: 'f2', name: 'onboarding_nuevo_cliente', status: 'ACTIVE',
    description: 'Bienvenida y primeros pasos',
    nodes: [
      { id: 'n1', type: 'trigger',      position: { x: 300, y: 40  }, data: { label: 'Cliente nuevo',   config: { type: 'campaign' } } },
      { id: 'n2', type: 'send_message', position: { x: 300, y: 190 }, data: { label: 'Bienvenida',      config: { messageType: 'template', templateName: 'bienvenida_cliente' } } },
      { id: 'n3', type: 'delay',        position: { x: 300, y: 360 }, data: { label: 'Esperar 1 día',   config: { delayMinutes: 1440 } } },
      { id: 'n4', type: 'send_message', position: { x: 300, y: 510 }, data: { label: 'Tips de uso',     config: { messageType: 'text', text: '¿Sabías que puedes gestionar todo desde tu panel?' } } },
      { id: 'n5', type: 'end',          position: { x: 300, y: 670 }, data: { label: 'Onboarding listo' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', style: { stroke: '#267EF0', strokeWidth: 2 } },
      { id: 'e2', source: 'n2', target: 'n3', style: { stroke: '#267EF0', strokeWidth: 2 } },
      { id: 'e3', source: 'n3', target: 'n4', style: { stroke: '#267EF0', strokeWidth: 2 } },
      { id: 'e4', source: 'n4', target: 'n5', style: { stroke: '#267EF0', strokeWidth: 2 } },
    ],
  },
  'GET /flows/f3': {
    id: 'f3', name: 'soporte_tecnico', status: 'DRAFT',
    description: 'Atención técnica automatizada',
    nodes: [
      { id: 'n1', type: 'trigger',       position: { x: 300, y: 40  }, data: { label: 'Mensaje entrante', config: { type: 'inbound' } } },
      { id: 'n2', type: 'send_message',  position: { x: 300, y: 190 }, data: { label: 'Menú soporte',     config: { messageType: 'text', text: 'Hola, ¿en qué podemos ayudarte? 1-Facturación 2-Técnico 3-Otro' } } },
      { id: 'n3', type: 'wait_response', position: { x: 300, y: 360 }, data: { label: 'Esperar opción',   config: { timeoutHours: 1, saveAs: 'opcion_menu' } } },
      { id: 'n4', type: 'end',           position: { x: 300, y: 520 }, data: { label: 'Derivar a agente' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', style: { stroke: '#267EF0', strokeWidth: 2 } },
      { id: 'e2', source: 'n2', target: 'n3', style: { stroke: '#267EF0', strokeWidth: 2 } },
      { id: 'e3', source: 'n3', target: 'n4', style: { stroke: '#267EF0', strokeWidth: 2 } },
    ],
  },

  // ─── Campaigns ──────────────────────────────────────────────────────────────
  'GET /campaigns': [
    { id: 'c1', name: 'Cobros Agosto 2025', status: 'COMPLETED', totalContacts: 1200, sent: 1200, delivered: 1148, read: 820, failed: 52, template: { name: 'cobros_atrasados' } },
    { id: 'c2', name: 'Promo Verano',       status: 'RUNNING',   totalContacts: 1000, sent: 850,  delivered: 820,  read: 560, failed: 30, template: { name: 'promo_agosto' } },
    { id: 'c3', name: 'Bienvenida Q3',      status: 'DRAFT',     totalContacts: 500,  sent: 0,    delivered: 0,    read: 0,   failed: 0,  template: { name: 'bienvenida_cliente' } },
    { id: 'c4', name: 'Recordatorio Sep',   status: 'PAUSED',    totalContacts: 400,  sent: 320,  delivered: 298,  read: 180, failed: 22, template: { name: 'recordatorio_pago' } },
  ],

  // ─── Contacts ───────────────────────────────────────────────────────────────
  'GET /contacts': [
    { id: 'co1', name: 'María García',   phone: '+5491122334455', tags: ['cliente', 'cobro'], optedOut: false },
    { id: 'co2', name: 'Juan Pérez',     phone: '+5491133445566', tags: ['nuevo'],             optedOut: false },
    { id: 'co3', name: 'Ana Martínez',   phone: '+5491144556677', tags: ['vip'],               optedOut: false },
    { id: 'co4', name: 'Carlos López',   phone: '+5491155667788', tags: ['cobro'],             optedOut: false },
    { id: 'co5', name: 'Laura Gómez',    phone: '+5491166778899', tags: ['cliente'],           optedOut: false },
    { id: 'co6', name: 'Pedro Ramírez',  phone: '+5491177889900', tags: ['cobro', 'moroso'],   optedOut: false },
  ],

  // ─── Conversations ──────────────────────────────────────────────────────────
  'GET /conversations': [
    {
      id: 'cv1', status: 'OPEN',
      contact: { name: 'María García', phone: '+5491122334455' },
      messages: [{ content: { text: 'Hola, consulto por mi deuda' } }],
      lastMessageAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    },
    {
      id: 'cv2', status: 'OPEN',
      contact: { name: 'Juan Pérez', phone: '+5491133445566' },
      messages: [{ content: { text: '¿Cuándo vence mi próximo pago?' } }],
      lastMessageAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 'cv3', status: 'CLOSED',
      contact: { name: 'Ana Martínez', phone: '+5491144556677' },
      messages: [{ content: { text: 'Gracias por la información' } }],
      lastMessageAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
  ],

  // ─── Tenants (= Clientes) ────────────────────────────────────────────────────
  'GET /tenants': [
    { id: 'cl1', name: 'Banco Nacional SA',      slug: 'banco-nacional',    plan: 'ENTERPRISE', status: 'ACTIVE',    document: '900.123.456-1', email: 'ops@banconacional.com',    phone: '+5716001234', contactLimit: 5000, omitActive: true,  notes: 'Cliente enterprise',          createdAt: new Date(Date.now() - 90 * 86400 * 1000).toISOString(), _count: { users: 8, campaigns: 12, contacts: 4800 } },
    { id: 'cl2', name: 'Créditos Rápidos SAS',   slug: 'creditos-rapidos',  plan: 'GROWTH',     status: 'ACTIVE',    document: '830.456.789-2', email: 'admin@creditosrapidos.co', phone: '+5716005678', contactLimit: 2000, omitActive: true,  notes: null,                          createdAt: new Date(Date.now() - 60 * 86400 * 1000).toISOString(), _count: { users: 4, campaigns: 5,  contacts: 1800 } },
    { id: 'cl3', name: 'Fiduciaria Andina',       slug: 'fiduciaria-andina', plan: 'STARTER',    status: 'ACTIVE',    document: '860.000.123-4', email: 'tech@fidandina.co',        phone: '+5716009012', contactLimit: 1000, omitActive: false, notes: 'Requiere aprobación manual', createdAt: new Date(Date.now() - 30 * 86400 * 1000).toISOString(), _count: { users: 2, campaigns: 2,  contacts: 900  } },
    { id: 'cl4', name: 'Microcréditos del Valle', slug: 'microcreditos-valle', plan: 'STARTER',  status: 'SUSPENDED', document: '900.987.654-5', email: null,                       phone: '+5723001234', contactLimit: 500,  omitActive: true,  notes: 'Cuenta suspendida',           createdAt: new Date(Date.now() - 15 * 86400 * 1000).toISOString(), _count: { users: 1, campaigns: 0,  contacts: 480  } },
  ],

  // ─── Bulk Uploads ────────────────────────────────────────────────────────────
  'GET /bulk-uploads': [
    { id: 'u1', fileName: 'cobros_agosto_2025.csv',  fileSize: 245_120, mimeType: 'text/csv', status: 'COMPLETED',   totalRows: 1200, processedRows: 1200, failedRows: 48,  createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString() },
    { id: 'u2', fileName: 'nuevos_clientes_q3.xlsx', fileSize: 89_400,  mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', status: 'COMPLETED', totalRows: 450, processedRows: 450, failedRows: 3, createdAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString() },
    { id: 'u3', fileName: 'morosos_sep.csv',         fileSize: 132_000, mimeType: 'text/csv', status: 'PROCESSING',  totalRows: 800,  processedRows: 320,  failedRows: 0,   createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString() },
    { id: 'u4', fileName: 'base_vip.csv',            fileSize: 45_000,  mimeType: 'text/csv', status: 'FAILED',      totalRows: 0,    processedRows: 0,    failedRows: 0,   createdAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString() },
  ],

  // ─── Reports: HSM sends ──────────────────────────────────────────────────────
  'GET /analytics/reports/hsm': {
    data: [
      { id: 'd1', status: 'READ',      sentAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), contact: { name: 'María García',  phone: '+5491122334455' }, campaign: { name: 'Cobros Agosto 2025', template: { name: 'cobros_atrasados', category: 'UTILITY' } } },
      { id: 'd2', status: 'DELIVERED', sentAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), contact: { name: 'Juan Pérez',    phone: '+5491133445566' }, campaign: { name: 'Cobros Agosto 2025', template: { name: 'cobros_atrasados', category: 'UTILITY' } } },
      { id: 'd3', status: 'FAILED',    sentAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), contact: { name: 'Carlos López',  phone: '+5491155667788' }, campaign: { name: 'Cobros Agosto 2025', template: { name: 'cobros_atrasados', category: 'UTILITY' } } },
      { id: 'd4', status: 'READ',      sentAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), contact: { name: 'Ana Martínez', phone: '+5491144556677' }, campaign: { name: 'Promo Verano',        template: { name: 'promo_agosto',     category: 'MARKETING' } } },
      { id: 'd5', status: 'SENT',      sentAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), contact: { name: 'Laura Gómez',  phone: '+5491166778899' }, campaign: { name: 'Promo Verano',        template: { name: 'promo_agosto',     category: 'MARKETING' } } },
    ],
    total: 18432, page: 1, limit: 50, pages: 369,
  },

  // Reports: summary
  'GET /analytics/reports/summary': {
    byStatus: [
      { status: 'READ',      count: 12608 },
      { status: 'DELIVERED', count: 4502  },
      { status: 'SENT',      count: 1002  },
      { status: 'FAILED',    count: 320   },
    ],
    byTemplate: [
      { templateId: 't1', templateName: 'cobros_atrasados', category: 'UTILITY',   sent: 9200, delivered: 8750, read: 6800, failed: 450, campaigns: 8 },
      { templateId: 't2', templateName: 'bienvenida_cliente', category: 'MARKETING', sent: 4500, delivered: 4320, read: 3100, failed: 180, campaigns: 5 },
      { templateId: 't4', templateName: 'confirmacion_cita', category: 'UTILITY',   sent: 4732, delivered: 4040, read: 2708, failed: 692, campaigns: 11 },
    ],
  },

  // Reports: conversations
  'GET /analytics/reports/conversations': {
    data: [
      { id: 'cv1', status: 'OPEN',   startedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), contact: { name: 'María García', phone: '+5491122334455' }, messages: [{ direction: 'OUTBOUND', content: { text: 'Hola, tienes deuda pendiente' }, createdAt: new Date().toISOString() }, { direction: 'INBOUND', content: { text: '¿Cuánto debo exactamente?' }, createdAt: new Date().toISOString() }] },
      { id: 'cv2', status: 'CLOSED', startedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), contact: { name: 'Juan Pérez',   phone: '+5491133445566' }, messages: [{ direction: 'OUTBOUND', content: { text: 'Recordatorio de pago' }, createdAt: new Date().toISOString() }, { direction: 'INBOUND', content: { text: 'Ya pagué, gracias' }, createdAt: new Date().toISOString() }] },
    ],
    total: 127, page: 1, limit: 50, pages: 3,
  },

  // Logs
  'GET /logs': [
    { id: 'l1', level: 'INFO',  action: 'campaign.started', resource: 'campaign', resourceId: 'c1', userId: 'mock-user-1', createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
    { id: 'l2', level: 'ERROR', action: 'dispatch.failed',  resource: 'dispatch', resourceId: 'd3', userId: null,          createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
    { id: 'l3', level: 'INFO',  action: 'user.login',       resource: 'user',     resourceId: 'mock-user-1', userId: 'mock-user-1', createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
    { id: 'l4', level: 'WARN',  action: 'rate.limit',       resource: 'api',      resourceId: null, userId: null,          createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
  ],
  'GET /logs/stats': { total: 4842, errors: 128, warnings: 214, info: 4500 },

  // Admin stats
  'GET /analytics/admin/stats': {
    activeClients: 12,
    activeUsers: 47,
    totalMessagesSent: 248_320,
    totalMessagesFailed: 8_240,
    activeCampaigns: 6,
  },

  // ─── Admin: Users list ──────────────────────────────────────────────────────
  'GET /users': [
    { id: 'u1', name: 'Demo Admin',   email: 'admin@cobrix.com',    role: 'TENANT_ADMIN',    tenantId: 'cl1', isEmailVerified: true,  twoFactorEnabled: true,  lastLoginAt: new Date().toISOString(),                            tenant: { id: 'cl1', name: 'Banco Nacional SA',    slug: 'banco-nacional' } },
    { id: 'u2', name: 'Carlos Ops',   email: 'carlos@banconal.com',   role: 'TENANT_OPERATOR', tenantId: 'cl1', isEmailVerified: true,  twoFactorEnabled: false, lastLoginAt: new Date(Date.now() - 86400 * 1000).toISOString(),  tenant: { id: 'cl1', name: 'Banco Nacional SA',    slug: 'banco-nacional' } },
    { id: 'u3', name: 'Laura Viewer', email: 'laura@banconal.com',    role: 'TENANT_VIEWER',   tenantId: 'cl1', isEmailVerified: true,  twoFactorEnabled: false, lastLoginAt: null,                                              tenant: { id: 'cl1', name: 'Banco Nacional SA',    slug: 'banco-nacional' } },
    { id: 'u4', name: 'Super Admin',  email: 'super@cobrix.com',    role: 'SUPER_ADMIN',     tenantId: null,  isEmailVerified: true,  twoFactorEnabled: true,  lastLoginAt: new Date().toISOString(),                            tenant: null },
    { id: 'u5', name: 'Ana Créditos', email: 'ana@creditosrapidos.co', role: 'TENANT_ADMIN',   tenantId: 'cl2', isEmailVerified: true,  twoFactorEnabled: false, lastLoginAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(), tenant: { id: 'cl2', name: 'Créditos Rápidos SAS', slug: 'creditos-rapidos' } },
  ],

  // Sessions
  'GET /users/me/sessions': [
    {
      id: 's1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      ipAddress: '192.168.1.1',
      createdAt: new Date().toISOString(),
    },
  ],
};

/** Resuelve el mock para un método+path dado */
export function resolveMock(method: string, path: string): unknown {
  const key = `${method.toUpperCase()} ${path}`;
  if (MOCK_RESPONSES[key] !== undefined) return MOCK_RESPONSES[key];

  // Exact match for PUT/POST/DELETE (save flow graph etc.)
  if (method !== 'GET') return { success: true };

  // GET: exact key first, then prefix match
  for (const [k, v] of Object.entries(MOCK_RESPONSES)) {
    if (k === `GET ${path}`) return v;
  }
  for (const [k, v] of Object.entries(MOCK_RESPONSES)) {
    if (k.startsWith('GET ') && path.startsWith(k.replace('GET ', ''))) return v;
  }

  return null;
}
