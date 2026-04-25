'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';
import { Anomaly, AnomalyStatus } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

const statusOptions: { value: '' | AnomalyStatus; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'OPEN', label: 'Abertos' },
  { value: 'IN_PROGRESS', label: 'Em Andamento' },
  { value: 'RESOLVED', label: 'Resolvidos' },
];

const nextStatus: Record<AnomalyStatus, { status: AnomalyStatus; label: string } | null> = {
  OPEN: { status: 'IN_PROGRESS', label: 'Marcar em andamento' },
  IN_PROGRESS: { status: 'RESOLVED', label: 'Marcar como resolvido' },
  RESOLVED: null,
};

export default function AnomaliesPage() {
  const [statusFilter, setStatusFilter] = useState<'' | AnomalyStatus>('');
  const queryClient = useQueryClient();

  const { data: anomalies, isLoading } = useQuery<Anomaly[]>({
    queryKey: ['anomalies', statusFilter],
    queryFn: () => {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      return api.get(`/reports/anomalies${params}`).then((r) => r.data);
    },
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AnomalyStatus }) =>
      api.patch(`/reports/anomalies/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Erro ao actualizar estado'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Anomalias</h1>
        <p className="text-sm text-gray-500">Relatórios de anomalias e não conformidades</p>
      </div>

      <div className="flex gap-2">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-surface-2 text-gray-400 border border-border hover:bg-surface-1'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-md bg-surface-3" />
            ))}
          </div>
        ) : !anomalies?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <AlertTriangle className="mb-3 h-10 w-10 opacity-40" />
            <p className="text-sm">Nenhuma anomalia encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/50 bg-surface-1">
                <tr className="text-left text-xs font-medium text-gray-500">
                  <th className="px-6 py-3">Título</th>
                  <th className="px-6 py-3">Área</th>
                  <th className="px-6 py-3">Gravidade</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">Reportado em</th>
                  <th className="px-6 py-3">Reportado por</th>
                  <th className="px-6 py-3">Acção</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {anomalies.map((anomaly) => {
                  const next = nextStatus[anomaly.status];
                  return (
                    <tr key={anomaly.id} className="hover:bg-surface-1">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-100">{anomaly.title}</p>
                        {anomaly.description && (
                          <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">
                            {anomaly.description}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{anomaly.area?.name ?? anomaly.areaId}</td>
                      <td className="px-6 py-4">
                        <Badge status={anomaly.severity} />
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={anomaly.status} />
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {format(new Date(anomaly.createdAt), "d MMM yyyy", { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{anomaly.reporter?.name ?? anomaly.reporterId}</td>
                      <td className="px-6 py-4">
                        {next ? (
                          <button
                            onClick={() => updateStatus({ id: anomaly.id, status: next.status })}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
                          >
                            {next.label}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
