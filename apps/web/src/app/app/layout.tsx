'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, AlertTriangle, Package, Home, ClipboardCheck, Settings, type LucideIcon } from 'lucide-react';
import { ShaderBackground } from '@/components/ui/ShaderBackground';
import { useAuthStore } from '@/store/auth.store';

type NavItem = { href: string; icon: LucideIcon; label: string; exact?: boolean };

const baseNavItems: NavItem[] = [
  { href: '/app', icon: Home, label: 'Início', exact: true },
  { href: '/app/checklists', icon: ClipboardList, label: 'Checklists' },
  { href: '/app/anomalias', icon: AlertTriangle, label: 'Anomalias' },
  { href: '/app/consumiveis', icon: Package, label: 'Consumíveis' },
  { href: '/app/registos', icon: ClipboardCheck, label: 'Registos' },
];

const adminNavItem: NavItem = { href: '/app/gestao', icon: Settings, label: 'Gestão' };

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, hydrated, hydrate } = useAuthStore();

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated) return null;

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden">
      <ShaderBackground />

      {/* Header */}
      <header className="relative z-10 bg-white/10 backdrop-blur-xl border-b border-white/20 text-white px-4 py-3 flex items-center justify-between sticky top-0 shadow">
        <span className="font-bold text-lg">Patakus</span>
        <span className="text-sm text-white/70 truncate max-w-[180px]">{user?.name}</span>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 overflow-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-xl border-t border-white/20 flex z-10">
        {[...baseNavItems, ...(user?.role === 'SUPER_ADMIN' || user?.role === 'CLIENT_ADMIN' ? [adminNavItem] : [])].map(({ href, icon: Icon, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
                active ? 'text-white' : 'text-white/50'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
