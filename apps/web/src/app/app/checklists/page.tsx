'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronRight, ClipboardList, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { ChecklistTemplate } from '@/types';

const freqLabel: Record<string, string> = {
  DAILY: 'Diária',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
};

const freqColor: Record<string, string> = {
  DAILY: 'bg-blue-100 text-blue-700',
  WEEKLY: 'bg-purple-100 text-purple-700',
  MONTHLY: 'bg-orange-100 text-orange-700',
};

export default function ChecklistsPage() {
  const { data: templates, isLoading, refetch } = useQuery<ChecklistTemplate[]>({
    queryKey: ['app-checklist-templates'],
    queryFn: () => api.get('/checklists/templates').then(r => r.data),
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">Checklists</h1>
        <button onClick={() => refetch()} className="p-2 text-gray-400 active:text-blue-600">
          <RefreshCw size={18} />
        </button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!templates || templates.length === 0) && (
        <div className="text-center py-12 text-gray-400">
          <ClipboardList size={40} className="mx-auto mb-2 opacity-40" />
          <p>Nenhuma checklist disponível</p>
        </div>
      )}

      <div className="space-y-3">
        {templates?.map(t => (
          <Link
            key={t.id}
            href={`/app/checklists/${t.id}`}
            className="flex items-center bg-white rounded-xl p-4 shadow-sm border border-gray-100 gap-3 active:bg-gray-50"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <ClipboardList size={20} className="text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{t.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${freqColor[t.frequency] ?? 'bg-gray-100 text-gray-600'}`}>
                {freqLabel[t.frequency] ?? t.frequency}
              </span>
            </div>
            <ChevronRight size={16} className="text-gray-300 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
