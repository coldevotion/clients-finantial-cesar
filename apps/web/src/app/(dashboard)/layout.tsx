'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { ProViredLogo } from '@/components/ProViredLogo';
import {
  LayoutDashboard, FileText, Workflow, Megaphone,
  Users, MessageSquare, PieChart, UserCircle, LogOut,
  Building2, Upload, ShieldCheck, UsersRound,
  Activity, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useState } from 'react';

// ─── Nav definition ──────────────────────────────────────────────────────────

const USER_NAV = [
  { href: '/',              label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/templates',     label: 'Plantillas HSM',  icon: FileText },
  { href: '/flows',         label: 'Flujos',          icon: Workflow },
  { href: '/campaigns',     label: 'Campañas',        icon: Megaphone },
  { href: '/contacts',      label: 'Contactos',       icon: Users },
  { href: '/uploads',       label: 'Cargue masivo',   icon: Upload },
  { href: '/conversations', label: 'Conversaciones',  icon: MessageSquare },
  { href: '/reports',       label: 'Reportes',        icon: PieChart },
];

const ADMIN_NAV = [
  { href: '/admin/clients', label: 'Clientes',        icon: Building2 },
  { href: '/admin/users',   label: 'Usuarios',        icon: UsersRound },
  { href: '/admin/system',  label: 'Sistema y Logs',  icon: Activity },
];

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'TENANT_ADMIN']);

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.FC<any>; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
        ${active
          ? 'bg-primary-500 text-white shadow-sm'
          : 'text-slate-400 hover:bg-navy-700 hover:text-white'
        }`}
    >
      <Icon size={16} className={active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
      {label}
    </Link>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { clearAuth, user } = useAuthStore();
  const [adminOpen, setAdminOpen] = useState(() =>
    ADMIN_NAV.some(n => pathname === n.href || pathname.startsWith(n.href + '/')),
  );

  const userIsAdmin = user ? ADMIN_ROLES.has(user.role) : false;

  function handleLogout() {
    clearAuth();
    router.push('/login');
  }

  return (
    <div className="flex h-screen bg-surface overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 bg-navy-900 flex flex-col">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-navy-700">
          <ProViredLogo variant="full" size={36} />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">

          {/* ── Usuario section ───────────────────────────────────── */}
          <p className="px-3 pt-1 pb-2 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
            Principal
          </p>
          {USER_NAV.map(item => (
            <NavLink key={item.href} {...item} active={isActive(pathname, item.href)} />
          ))}

          {/* ── Admin section (only for SUPER_ADMIN / TENANT_ADMIN) ── */}
          {userIsAdmin && (
            <div className="mt-3">
              {/* Collapsible header */}
              <button
                onClick={() => setAdminOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 pt-3 pb-2 text-[9px] font-bold text-slate-600 uppercase tracking-widest hover:text-slate-400 transition-colors"
              >
                <span>Administración</span>
                {adminOpen
                  ? <ChevronUp size={11} className="text-slate-600" />
                  : <ChevronDown size={11} className="text-slate-600" />
                }
              </button>

              {adminOpen && (
                <div className="space-y-0.5">
                  {/* Visual separator */}
                  <div className="mx-3 mb-2 h-px bg-navy-700" />
                  {ADMIN_NAV.map(item => (
                    <NavLink key={item.href} {...item} active={isActive(pathname, item.href)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 border-t border-navy-700 pt-3 space-y-0.5">

          {/* Role badge */}
          {user && (
            <div className="px-3 pb-2 flex items-center gap-2">
              {userIsAdmin && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary-500/20 text-primary-400 border border-primary-500/30">
                  <ShieldCheck size={9} />
                  {user.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : 'ADMIN'}
                </span>
              )}
            </div>
          )}

          <Link
            href="/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
              ${isActive(pathname, '/profile')
                ? 'bg-primary-500 text-white'
                : 'text-slate-400 hover:bg-navy-700 hover:text-white'
              }`}
          >
            <UserCircle size={16} className="text-slate-500 group-hover:text-slate-300" />
            Mi cuenta
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 cursor-pointer"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>

          {user && (
            <div className="px-3 pt-2 pb-1">
              <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
