'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCog,
  MapPin,
  ClipboardList,
  AlertTriangle,
  Package,
  ShoppingCart,
  Box,
  Thermometer,
  ChevronRight,
  ChevronDown,
  PackageCheck,
  SprayCan,
  FlaskConical,
  Flame,
  BookOpen,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  prefix: string; // pathname prefix to auto-expand
  roles?: string[];
  children: NavItem[];
}

type NavEntry = NavItem | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry;
}

const navEntries: NavEntry[] = [
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { href: '/clients', label: 'Clientes', icon: Users, roles: ['SUPER_ADMIN'] },
  { href: '/users', label: 'Utilizadores', icon: UserCog, roles: ['SUPER_ADMIN', 'CLIENT_ADMIN'] },
  { href: '/areas', label: 'Áreas', icon: MapPin },
  { href: '/checklists', label: 'Checklists', icon: ClipboardList },
  { href: '/anomalies', label: 'Anomalias', icon: AlertTriangle },
  { href: '/consumables', label: 'Consumíveis', icon: Package },
  { href: '/orders', label: 'Encomendas', icon: ShoppingCart },
  {
    label: 'Registos',
    icon: BookOpen,
    prefix: '/registos',
    children: [
      { href: '/registos/entradas', label: 'Entradas', icon: PackageCheck },
      { href: '/registos/temperaturas', label: 'Temperaturas', icon: Thermometer },
      { href: '/registos/higienizacao', label: 'Higienização', icon: SprayCan },
      { href: '/registos/desinfecao', label: 'Desinfeção', icon: FlaskConical },
      { href: '/registos/oleos', label: 'Óleos de Fritura', icon: Flame },
    ],
  },
  { href: '/products', label: 'Produtos', icon: Box, roles: ['SUPER_ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const registosOpen = pathname.startsWith('/registos');
  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>({ registos: registosOpen });

  const { data: stats } = useQuery<{ openShortageReports: number }>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data),
    refetchInterval: 60_000,
    enabled: !!user,
  });

  function isVisible(entry: NavEntry) {
    const roles = entry.roles;
    if (!roles) return true;
    return !!(user && roles.includes(user.role));
  }

  function toggleGroup(key: string) {
    setGroupOpen(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Image src="/logo-patakus.png" alt="Patakus" width={120} height={42} priority />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navEntries.filter(isVisible).map((entry) => {
            if (isGroup(entry)) {
              const key = entry.prefix.replace('/', '');
              const isExpanded = groupOpen[key] ?? pathname.startsWith(entry.prefix);
              const isActive = pathname.startsWith(entry.prefix);
              const Icon = entry.icon;
              const visibleChildren = entry.children.filter(isVisible);

              return (
                <li key={entry.prefix}>
                  <button
                    onClick={() => toggleGroup(key)}
                    className={clsx(
                      'w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 text-left">{entry.label}</span>
                    {isExpanded
                      ? <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                      : <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
                  </button>

                  {isExpanded && (
                    <ul className="mt-0.5 space-y-0.5 pl-3">
                      {visibleChildren.map((child) => {
                        const childActive = pathname === child.href || pathname.startsWith(child.href + '/');
                        const ChildIcon = child.icon;
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={clsx(
                                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                                childActive
                                  ? 'bg-blue-100 text-blue-700 font-medium'
                                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                              )}
                            >
                              <ChildIcon className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="flex-1">{child.label}</span>
                              {childActive && <ChevronRight className="h-3 w-3 opacity-40" />}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            const item = entry as NavItem;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.href === '/consumables' && (stats?.openShortageReports ?? 0) > 0 && (
                    <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {stats!.openShortageReports > 9 ? '9+' : stats!.openShortageReports}
                    </span>
                  )}
                  {isActive && <ChevronRight className="h-3 w-3 opacity-50" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {user && (
        <div className="border-t border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-500">
            {user.role === 'SUPER_ADMIN'
              ? 'Super Admin'
              : user.role === 'CLIENT_ADMIN'
              ? 'Administrador'
              : 'Operador'}
          </p>
        </div>
      )}
    </aside>
  );
}
