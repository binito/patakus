'use client';

import { useEffect } from 'react';
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
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p className="text-gray-500 text-sm">{greeting()},</p>
        <p className="text-xl font-bold text-gray-800">{user?.name?.split(' ')[0]}</p>
        <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Acesso rápido</h2>

      <div className="space-y-3">
        <Link href="/app/checklists" className="flex items-center bg-white rounded-xl p-4 shadow-sm border border-gray-100 gap-4 active:bg-gray-50">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <ClipboardList size={20} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-800">Checklists</p>
            <p className="text-xs text-gray-400">
              {pendingChecklists?.length ?? '—'} templates disponíveis
            </p>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </Link>

        <Link href="/app/anomalias" className="flex items-center bg-white rounded-xl p-4 shadow-sm border border-gray-100 gap-4 active:bg-gray-50">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-800">Anomalias</p>
            <p className="text-xs text-gray-400">
              {openAnomalies?.length ?? '—'} em aberto
            </p>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </Link>

        <Link href="/app/consumiveis" className="flex items-center bg-white rounded-xl p-4 shadow-sm border border-gray-100 gap-4 active:bg-gray-50">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <Package size={20} className="text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-800">Consumíveis</p>
            <p className="text-xs text-gray-400">Registar consumo</p>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </Link>
      </div>

      <button
        onClick={logout}
        className="w-full text-center text-sm text-gray-400 py-4 active:text-gray-600"
      >
        Sair da conta
      </button>
    </div>
  );
}
