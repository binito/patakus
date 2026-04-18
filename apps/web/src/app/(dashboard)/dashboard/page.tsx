'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, MapPin, ShoppingCart, ClipboardList, Package } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';
import { Anomaly, Order } from '@/types';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';

interface DashboardStats {
  totalClients: number;
  totalAreas: number;
  openAnomalies: number;
  pendingOrders: number;
  openShortageReports: number;
  checklistsThisMonth: number;
}

interface ShortageReport {
  id: string; quantity?: number; notes?: string;
  status: string; createdAt: string;
  stock?: { product?: { name: string; unit: string }; clientId: string };
  reporter?: { name: string };
}

function StatCard({ label, value, icon: Icon, color, href }: {
  label: string; value: number | string;
  icon: React.ElementType; color: string; href?: string;
}) {
  const inner = (
    <Card className={href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}>
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function DashboardPage() {
  const user = useAuthStore(s => s.user);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data),
    refetchInterval: 60_000, // actualiza a cada minuto
  });

  const { data: recentAnomalies, isLoading: anomaliesLoading } = useQuery<Anomaly[]>({
    queryKey: ['recent-anomalies'],
    queryFn: () => api.get('/reports/anomalies?status=OPEN').then(r => r.data),
  });

  const { data: openShortages, isLoading: shortagesLoading } = useQuery<ShortageReport[]>({
    queryKey: ['open-shortages'],
    queryFn: () => api.get('/consumables/reports').then(r => r.data.filter((r: ShortageReport) => r.status === 'OPEN')),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Painel</h1>
        <p className="text-sm text-gray-500">Visão geral das operações</p>
      </div>

      {/* Stat cards */}
      {statsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: isSuperAdmin ? 6 : 5 }).map((_, i) => (
            <Card key={i}><div className="h-16 animate-pulse rounded-md bg-gray-100" /></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {isSuperAdmin && (
            <StatCard label="Clientes activos" value={stats?.totalClients ?? 0}
              icon={MapPin} color="bg-blue-100 text-blue-600" />
          )}
          <StatCard label="Áreas" value={stats?.totalAreas ?? 0}
            icon={MapPin} color="bg-indigo-100 text-indigo-600" />
          <StatCard label="Anomalias abertas" value={stats?.openAnomalies ?? 0}
            icon={AlertTriangle} color="bg-red-100 text-red-600" href="/anomalies" />
          <StatCard label="Pedidos pendentes" value={stats?.pendingOrders ?? 0}
            icon={ShoppingCart} color="bg-orange-100 text-orange-600" href="/orders" />
          <StatCard label="Faltas reportadas" value={stats?.openShortageReports ?? 0}
            icon={Package} color={stats?.openShortageReports ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}
            href="/consumables" />
          <StatCard label="Checklists este mês" value={stats?.checklistsThisMonth ?? 0}
            icon={ClipboardList} color="bg-green-100 text-green-600" href="/checklists" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Faltas de consumíveis */}
        <Card>
          <CardHeader>
            <CardTitle>Faltas de consumíveis</CardTitle>
            {(openShortages?.length ?? 0) > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                {openShortages!.length} em aberto
              </span>
            )}
          </CardHeader>
          {shortagesLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-12 animate-pulse rounded-md bg-gray-100" />)}
            </div>
          ) : !openShortages?.length ? (
            <p className="py-6 text-center text-sm text-gray-400">Sem faltas reportadas</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {openShortages.slice(0, 5).map(r => (
                <li key={r.id} className="py-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {r.stock?.product?.name ?? '—'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {r.reporter?.name}
                      {r.quantity ? ` · ${r.quantity} ${r.stock?.product?.unit ?? ''}` : ''}
                      {r.notes ? ` · "${r.notes}"` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {format(new Date(r.createdAt), "d MMM HH:mm", { locale: pt })}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {(openShortages?.length ?? 0) > 0 && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <Link href="/consumables" className="text-xs font-medium text-blue-600 hover:text-blue-800">
                Ver todas as faltas →
              </Link>
            </div>
          )}
        </Card>

        {/* Anomalias recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Anomalias abertas</CardTitle>
            <Badge status="OPEN" />
          </CardHeader>
          {anomaliesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-12 animate-pulse rounded-md bg-gray-100" />)}
            </div>
          ) : !recentAnomalies?.length ? (
            <p className="py-6 text-center text-sm text-gray-400">Nenhuma anomalia aberta</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentAnomalies.slice(0, 5).map(anomaly => (
                <li key={anomaly.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{anomaly.title}</p>
                    <p className="text-xs text-gray-500">{anomaly.area?.name ?? '—'}</p>
                  </div>
                  <Badge status={anomaly.severity} />
                </li>
              ))}
            </ul>
          )}
          {(recentAnomalies?.length ?? 0) > 0 && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <Link href="/anomalies" className="text-xs font-medium text-blue-600 hover:text-blue-800">
                Ver todas →
              </Link>
            </div>
          )}
        </Card>

        {/* Pedidos pendentes */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos pendentes</CardTitle>
            <Badge status="PENDING" />
          </CardHeader>
          {!stats ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-12 animate-pulse rounded-md bg-gray-100" />)}
            </div>
          ) : stats.pendingOrders === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">Nenhum pedido pendente</p>
          ) : (
            <div className="py-6 text-center">
              <p className="text-3xl font-bold text-orange-600">{stats.pendingOrders}</p>
              <p className="text-sm text-gray-500 mt-1">pedido{stats.pendingOrders !== 1 ? 's' : ''} a aguardar</p>
            </div>
          )}
          <div className="mt-3 border-t border-gray-100 pt-3">
            <Link href="/orders" className="text-xs font-medium text-blue-600 hover:text-blue-800">
              Ver encomendas →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
