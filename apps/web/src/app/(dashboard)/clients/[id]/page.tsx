'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, AlertTriangle, ClipboardList } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { Client, Area, Anomaly, ChecklistExecution } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: ['client', id],
    queryFn: () => api.get(`/clients/${id}`).then((r) => r.data),
    enabled: user?.role === 'SUPER_ADMIN',
  });

  const { data: areas } = useQuery<Area[]>({
    queryKey: ['client-areas', id],
    queryFn: () => api.get(`/clients/${id}/areas`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: recentChecklists } = useQuery<ChecklistExecution[]>({
    queryKey: ['client-checklists', id],
    queryFn: () => api.get(`/clients/${id}/checklists?limit=5`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: recentAnomalies } = useQuery<Anomaly[]>({
    queryKey: ['client-anomalies', id],
    queryFn: () => api.get(`/clients/${id}/anomalies?limit=5`).then((r) => r.data),
    enabled: !!id,
  });

  if (clientLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-md bg-gray-200" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <div className="h-32 animate-pulse rounded-md bg-gray-100" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{client?.name ?? 'Cliente'}</h1>
          {client?.nif && <p className="text-sm text-gray-500">NIF: {client.nif}</p>}
        </div>
        {client && (
          <Badge status={client.active ? 'ACTIVE' : 'INACTIVE'} className="ml-2" />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">E-mail</dt>
              <dd className="font-medium text-gray-900">{client?.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Telefone</dt>
              <dd className="font-medium text-gray-900">{client?.phone ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Cadastro</dt>
              <dd className="font-medium text-gray-900">
                {client?.createdAt
                  ? format(new Date(client.createdAt), "d 'de' MMM 'de' yyyy", { locale: ptBR })
                  : '—'}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              Áreas ({areas?.length ?? 0})
            </CardTitle>
          </CardHeader>
          {!areas?.length ? (
            <p className="text-sm text-gray-400">Nenhuma área cadastrada</p>
          ) : (
            <ul className="space-y-2">
              {areas.map((area) => (
                <li key={area.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-900">{area.name}</span>
                  <Badge status={area.active ? 'ACTIVE' : 'INACTIVE'} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Anomalias Recentes
            </CardTitle>
          </CardHeader>
          {!recentAnomalies?.length ? (
            <p className="text-sm text-gray-400">Nenhuma anomalia recente</p>
          ) : (
            <ul className="space-y-2">
              {recentAnomalies.map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-900 truncate max-w-[140px]">{a.title}</span>
                  <Badge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-green-600" />
            Checklists Recentes
          </CardTitle>
        </CardHeader>
        {!recentChecklists?.length ? (
          <p className="py-4 text-center text-sm text-gray-400">Nenhum checklist executado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
                  <th className="pb-3">Template</th>
                  <th className="pb-3">Área</th>
                  <th className="pb-3">Executado por</th>
                  <th className="pb-3">Data</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentChecklists.map((cl) => (
                  <tr key={cl.id}>
                    <td className="py-3 font-medium text-gray-900">{cl.templateId}</td>
                    <td className="py-3 text-gray-500">{cl.area?.name ?? cl.areaId}</td>
                    <td className="py-3 text-gray-500">{cl.operator?.name ?? cl.operatorId}</td>
                    <td className="py-3 text-gray-500">
                      {format(new Date(cl.completedAt), "d MMM yyyy", { locale: ptBR })}
                    </td>
                    <td className="py-3">
                      <Badge status="RESOLVED" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
