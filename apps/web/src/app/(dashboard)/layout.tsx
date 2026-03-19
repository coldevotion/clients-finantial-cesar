'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/templates', label: 'Plantillas' },
  { href: '/flows', label: 'Flujos' },
  { href: '/campaigns', label: 'Campañas' },
  { href: '/contacts', label: 'Contactos' },
  { href: '/conversations', label: 'Conversaciones' },
  { href: '/analytics', label: 'Reportes' },
  { href: '/profile', label: 'Mi cuenta' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { clearAuth, user } = useAuthStore();

  function handleLogout() {
    clearAuth();
    router.push('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">WA Campaigns</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 space-y-2">
          {user && (
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          )}
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
