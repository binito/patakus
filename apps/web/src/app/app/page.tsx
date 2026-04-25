'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ClipboardList, AlertTriangle, Package, ChevronRight, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

export default function AppHomePage() {
  const { user, logout } = useAuthStore();

  const { data: pendingChecklists } = useQuery({
    queryKey: ['app-pending-checklists'],
    queryFn: () => api.get('/checklists/templates').then(r => r.data),
  });

  const { data: openAnomalies } = useQuery({
    queryKey: ['app-open-anomalies'],
    queryFn: () => api.get('/reports/anomalies?status=OPEN').then(r => r.data),
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 19) return 'Boa tarde';
    return 'Boa noite';
  };

  const dateStr = new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="p-4 space-y-5">
      {/* Greeting */}
      <div className="pt-2">
        <p className="text-xs text-gray-600 uppercase tracking-widest">{greeting()}</p>
        <p className="mt-0.5 text-2xl font-bold text-gray-100">{user?.name?.split(' ')[0]}</p>
        <p className="mt-0.5 text-xs text-gray-600 capitalize">{dateStr}</p>
      </div>

      {/* Quick access */}
      <div>
        <p className="mb-2 text-xs font-medium text-gray-600 uppercase tracking-widest">Acesso rápido</p>
        <div className="space-y-2">
          <Link href="/app/checklists"
            className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-4 transition-colors active:bg-surface-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500/10">
              <ClipboardList size={18} className="text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200">Checklists</p>
              <p className="text-xs text-gray-600">{pendingChecklists?.length ?? '—'} templates disponíveis</p>
            </div>
            <ChevronRight size={14} className="text-gray-700 shrink-0" />
          </Link>

          <Link href="/app/anomalias"
            className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-4 transition-colors active:bg-surface-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
              <AlertTriangle size={18} className="text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200">Anomalias</p>
              <p className="text-xs text-gray-600">{openAnomalies?.length ?? '—'} em aberto</p>
            </div>
            <ChevronRight size={14} className="text-gray-700 shrink-0" />
          </Link>

          <Link href="/app/consumiveis"
            className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-4 transition-colors active:bg-surface-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
              <Package size={18} className="text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200">Consumíveis</p>
              <p className="text-xs text-gray-600">Registar consumo</p>
            </div>
            <ChevronRight size={14} className="text-gray-700 shrink-0" />
          </Link>
        </div>
      </div>

      <button
        onClick={logout}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm text-gray-600 transition-colors active:bg-surface-2"
      >
        <LogOut size={14} />
        Sair da conta
      </button>
    </div>
  );
}
