'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ClipboardList, AlertTriangle, Package, ChevronRight } from 'lucide-react';
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

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm p-4">
        <p className="text-white/50 text-sm">{greeting()},</p>
        <p className="text-xl font-bold text-white">{user?.name?.split(' ')[0]}</p>
        <p className="text-xs text-white/30 mt-1">{new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest px-1">Acesso rápido</h2>

      <div className="space-y-3">
        <Link href="/app/checklists" className="flex items-center rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm p-4 gap-4 active:bg-white/5 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-primary-400/20 flex items-center justify-center">
            <ClipboardList size={20} className="text-primary-300" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-white">Checklists</p>
            <p className="text-xs text-white/40">
              {pendingChecklists?.length ?? '—'} templates disponíveis
            </p>
          </div>
          <ChevronRight size={16} className="text-white/20" />
        </Link>

        <Link href="/app/anomalias" className="flex items-center rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm p-4 gap-4 active:bg-white/5 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-rose-400/20 flex items-center justify-center">
            <AlertTriangle size={20} className="text-rose-300" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-white">Anomalias</p>
            <p className="text-xs text-white/40">
              {openAnomalies?.length ?? '—'} em aberto
            </p>
          </div>
          <ChevronRight size={16} className="text-white/20" />
        </Link>

        <Link href="/app/consumiveis" className="flex items-center rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm p-4 gap-4 active:bg-white/5 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-emerald-400/20 flex items-center justify-center">
            <Package size={20} className="text-emerald-300" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-white">Consumíveis</p>
            <p className="text-xs text-white/40">Registar consumo</p>
          </div>
          <ChevronRight size={16} className="text-white/20" />
        </Link>
      </div>

      <button
        onClick={logout}
        className="w-full text-center text-sm text-white/30 py-4 active:text-white/60"
      >
        Sair da conta
      </button>
    </div>
  );
}
