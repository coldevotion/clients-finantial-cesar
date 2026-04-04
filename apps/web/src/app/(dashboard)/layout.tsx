'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api-client';
import { CobrixLogo } from '@/components/CobrixLogo';
import { useTheme } from '@/components/providers/theme-provider';
import {
  LayoutDashboard, FileText, Workflow, Megaphone,
  Users, MessageSquare, PieChart, UserCircle, LogOut,
  Building2, Upload, ShieldCheck, UsersRound,
  Activity, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Menu, X,
  Sun, Moon, type LucideProps,
} from 'lucide-react';
import { useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavModuleItem {
  id: string;
  key: string;
  label: string;
  icon: string;
  order: number;
  isSuperAdmin: boolean;
}

// ─── Icon registry (lucide icon name → component) ────────────────────────────

const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  LayoutDashboard,
  FileText,
  Workflow,
  Megaphone,
  Users,
  Upload,
  MessageSquare,
  PieChart,
  Building2,
  UsersRound,
  Activity,
};

function toNavItem(m: NavModuleItem) {
  return { href: m.key, label: m.label, icon: ICON_MAP[m.icon] ?? LayoutDashboard };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

// ─── NavLink ──────────────────────────────────────────────────────────────────

function NavLink({
  href, label, icon: Icon, active, collapsed, onClick,
}: {
  href: string; label: string; icon: React.FC<any>; active: boolean; collapsed: boolean; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 group
        ${collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'}
        ${active
          ? 'bg-primary-500 text-white shadow-sm'
          : 'text-slate-400 hover:bg-navy-700 hover:text-white'
        }`}
    >
      <Icon
        size={16}
        className={`flex-shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}
      />
      {!collapsed && <span className="truncate">{label}</span>}
      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-2.5 z-50 whitespace-nowrap rounded-md bg-navy-800 border border-navy-600 px-2.5 py-1 text-xs font-medium text-slate-200 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {label}
        </span>
      )}
    </Link>
  );
}

// ─── Theme toggle ─────────────────────────────────────────────────────────────

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      onClick={toggle}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] text-slate-600 hover:text-slate-400 hover:bg-navy-700 transition-all cursor-pointer"
    >
      {isDark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-slate-400" />}
      {!collapsed && <span>{isDark ? 'Modo claro' : 'Modo oscuro'}</span>}
    </button>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  collapsed, onToggle, mobileOpen, onMobileClose,
}: {
  collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onMobileClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { clearAuth, user } = useAuthStore();
  const [adminOpen, setAdminOpen] = useState(() => pathname.startsWith('/admin/'));

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // SUPER_ADMIN: carga todos los módulos del catálogo
  const { data: allModules } = useQuery<NavModuleItem[]>({
    queryKey: ['nav-modules'],
    queryFn: () => api.get('/nav-modules'),
    enabled: !!user && isSuperAdmin,
  });

  // Tenant users: carga los módulos asignados a su tenant
  const { data: myTenant } = useQuery<{
    navModules: { navModule: NavModuleItem }[];
  }>({
    queryKey: ['my-tenant'],
    queryFn: () => api.get('/tenants/me'),
    enabled: !!user && !isSuperAdmin,
  });

  // Sección Principal: módulos con isSuperAdmin = false
  const principalItems = isSuperAdmin
    ? (allModules ?? [])
        .filter(m => !m.isSuperAdmin)
        .sort((a, b) => a.order - b.order)
        .map(toNavItem)
    : (myTenant?.navModules ?? [])
        .map(tm => tm.navModule)
        .sort((a, b) => a.order - b.order)
        .map(toNavItem);

  // Sección Administración: módulos con isSuperAdmin = true (solo para SUPER_ADMIN)
  const adminItems = isSuperAdmin
    ? (allModules ?? [])
        .filter(m => m.isSuperAdmin)
        .sort((a, b) => a.order - b.order)
        .map(toNavItem)
    : [];

  const isLoading = !isSuperAdmin && !myTenant;

  function handleLogout() {
    clearAuth();
    router.push('/login');
  }

  // ── Nav section helper ────────────────────────────────────────────────────

  function renderNavItems(items: ReturnType<typeof toNavItem>[], mobile = false) {
    return items.map(item => (
      <NavLink
        key={item.href}
        {...item}
        active={isActive(pathname, item.href)}
        collapsed={mobile ? false : collapsed}
        onClick={onMobileClose}
      />
    ));
  }

  // ── Admin section ─────────────────────────────────────────────────────────

  function renderAdminSection(mobile = false) {
    if (!adminItems.length) return null;
    if (mobile || !collapsed) {
      return (
        <div className="mt-3">
          <button
            onClick={() => setAdminOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 pt-3 pb-2 text-[9px] font-bold text-slate-600 uppercase tracking-widest hover:text-slate-400 transition-colors cursor-pointer"
          >
            <span>Administración</span>
            {adminOpen
              ? <ChevronUp size={11} className="text-slate-600" />
              : <ChevronDown size={11} className="text-slate-600" />
            }
          </button>
          {adminOpen && (
            <div className="space-y-0.5">
              <div className="mx-3 mb-2 h-px bg-navy-700" />
              {renderNavItems(adminItems, mobile)}
            </div>
          )}
        </div>
      );
    }
    // collapsed desktop
    return (
      <div className="mt-3">
        <div className="my-2 h-px bg-navy-700 mx-1" />
        {renderNavItems(adminItems)}
      </div>
    );
  }

  // ── Sidebar content ───────────────────────────────────────────────────────

  const sidebarContent = (
    <aside className={`flex flex-col h-full bg-navy-900 transition-all duration-200 ${collapsed ? 'w-[68px]' : 'w-60'}`}>

      {/* Logo */}
      <div className={`flex-shrink-0 border-b border-navy-700 transition-all duration-200 ${collapsed ? 'px-0 py-5 justify-center flex' : 'px-5 py-5'}`}>
        {collapsed ? <CobrixLogo variant="icon" size={28} /> : <CobrixLogo variant="full" size={36} />}
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden ${collapsed ? 'px-2' : 'px-3'}`}>
        {!collapsed && <p className="px-3 pt-1 pb-2 text-[9px] font-bold text-slate-600 uppercase tracking-widest">Principal</p>}
        {collapsed && <div className="h-3" />}

        {isLoading
          ? [1,2,3,4].map(i => <div key={i} className="h-9 rounded-lg bg-navy-800 animate-pulse" />)
          : renderNavItems(principalItems)
        }

        {renderAdminSection()}
      </nav>

      {/* Footer */}
      <div className={`flex-shrink-0 border-t border-navy-700 pt-3 pb-3 space-y-0.5 ${collapsed ? 'px-2' : 'px-3'}`}>
        {!collapsed && user && isSuperAdmin && (
          <div className="px-3 pb-2">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary-500/20 text-primary-400 border border-primary-500/30">
              <ShieldCheck size={9} /> SUPER ADMIN
            </span>
          </div>
        )}

        <NavLink href="/profile" label="Mi cuenta" icon={UserCircle} active={isActive(pathname, '/profile')} collapsed={collapsed} onClick={onMobileClose} />

        <button
          onClick={handleLogout}
          title={collapsed ? 'Cerrar sesión' : undefined}
          className={`relative w-full flex items-center gap-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 cursor-pointer group ${collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'}`}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-2.5 z-50 whitespace-nowrap rounded-md bg-navy-800 border border-navy-600 px-2.5 py-1 text-xs font-medium text-slate-200 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              Cerrar sesión
            </span>
          )}
        </button>

        {!collapsed && user && (
          <div className="px-3 pt-1 pb-0.5">
            <p className="text-[10px] text-slate-600 truncate">{user.email}</p>
          </div>
        )}

        <div className={`pt-2 flex ${collapsed ? 'flex-col items-center gap-1' : 'items-center justify-between px-1'}`}>
          <ThemeToggle collapsed={collapsed} />
          <button
            onClick={onToggle}
            title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] text-slate-600 hover:text-slate-400 hover:bg-navy-700 transition-all cursor-pointer"
          >
            {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span>Colapsar</span></>}
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex flex-shrink-0 h-full">{sidebarContent}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onMobileClose} />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden flex">
            <aside className="flex flex-col h-full bg-navy-900 w-60">
              <div className="flex items-center justify-between px-5 py-5 border-b border-navy-700">
                <CobrixLogo variant="full" size={36} />
                <button onClick={onMobileClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-navy-700 transition-colors cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                <p className="px-3 pt-1 pb-2 text-[9px] font-bold text-slate-600 uppercase tracking-widest">Principal</p>
                {isLoading
                  ? [1,2,3,4].map(i => <div key={i} className="h-9 rounded-lg bg-navy-800 animate-pulse" />)
                  : renderNavItems(principalItems, true)
                }
                {renderAdminSection(true)}
              </nav>

              <div className="px-3 pb-4 border-t border-navy-700 pt-3 space-y-0.5">
                {user && isSuperAdmin && (
                  <div className="px-3 pb-2">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary-500/20 text-primary-400 border border-primary-500/30">
                      <ShieldCheck size={9} /> SUPER ADMIN
                    </span>
                  </div>
                )}
                <NavLink href="/profile" label="Mi cuenta" icon={UserCircle} active={isActive(pathname, '/profile')} collapsed={false} onClick={onMobileClose} />
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 cursor-pointer">
                  <LogOut size={16} /> Cerrar sesión
                </button>
                {user && <div className="px-3 pt-1 pb-0.5"><p className="text-[10px] text-slate-600 truncate">{user.email}</p></div>}
              </div>
            </aside>
          </div>
        </>
      )}
    </>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

const COLLAPSED_KEY = 'sidebar-collapsed';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    if (stored === 'true') setCollapsed(true);
  }, []);

  function handleToggle() {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  }

  return (
    <div className="flex h-screen bg-surface dark:bg-navy-900 overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={handleToggle} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex-shrink-0 md:hidden flex items-center gap-3 px-4 py-3 bg-navy-900 border-b border-navy-700 justify-between">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-700 transition-colors cursor-pointer" aria-label="Abrir menú">
            <Menu size={20} />
          </button>
          <CobrixLogo variant="full" size={30} />
          <ThemeToggle collapsed={true} />
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8 min-h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
