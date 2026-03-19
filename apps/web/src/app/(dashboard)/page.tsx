import { auth } from '@clerk/nextjs/server';

export default async function DashboardPage() {
  await auth.protect();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {['Campañas enviadas', 'Mensajes entregados', 'Tasa de lectura', 'Conversaciones activas'].map((label) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
