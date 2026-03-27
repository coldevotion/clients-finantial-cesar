import { FloatingIcons } from '@/components/auth/FloatingIcons';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-primary-50/30 to-surface dark:from-navy-900 dark:via-navy-800 dark:to-navy-900">
      <FloatingIcons />
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
