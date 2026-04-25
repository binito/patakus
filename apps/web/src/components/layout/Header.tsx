'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Painel',
  '/clients': 'Clientes',
  '/users': 'Utilizadores',
  '/areas': 'Áreas',
  '/checklists': 'Checklists',
  '/anomalies': 'Anomalias',
  '/consumables': 'Consumíveis',
  '/orders': 'Encomendas',
  '/products': 'Produtos',
  '/registos/entradas': 'Entradas',
  '/registos/temperaturas': 'Temperaturas',
  '/registos/higienizacao': 'Higienização',
  '/registos/desinfecao': 'Desinfeção',
  '/registos/oleos': 'Óleos de Fritura',
};

function initials(name?: string) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export function Header() {
  const { user } = useAuthStore();
  const pathname = usePathname();

  const title = Object.entries(pageTitles).find(([key]) => pathname.startsWith(key))?.[1] ?? '';

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface-1 px-6">
      <h1 className="text-sm font-semibold text-gray-100">{title}</h1>

      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500/20 text-xs font-semibold text-primary-400">
          {initials(user?.name)}
        </div>
        <span className="text-sm text-gray-400">{user?.name}</span>
      </div>
    </header>
  );
}
