'use client';

import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Lightbulb } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';
import { Order, Consumable } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function OrdersPage() {
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders').then((r) => r.data),
  });

  const { data: suggestions, isLoading: suggestionsLoading } = useQuery<Consumable[]>({
    queryKey: ['order-suggestions'],
    queryFn: () => api.get('/consumables?belowMinimum=true').then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Pedidos</h1>
        <p className="text-sm text-gray-500">Histórico de pedidos e sugestões de reposição</p>
      </div>

      {!suggestionsLoading && !!suggestions?.length && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Lightbulb className="h-4 w-4" />
              Sugestões de Reposição
            </CardTitle>
          </CardHeader>
          <p className="mb-3 text-sm text-blue-600">
            Os seguintes consumíveis estão abaixo do estoque mínimo e podem precisar de reposição:
          </p>
          <ul className="space-y-2">
            {suggestions.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-md bg-surface-2 px-4 py-2 text-sm shadow-sm">
                <span className="font-medium text-gray-100">{c.product?.name ?? c.productId}</span>
                <span className="text-gray-500">
                  {c.quantity} / {c.minQuantity} {c.product?.unit ?? "un"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card padding="none">
        <div className="border-b border-border/50 px-6 py-4">
          <h2 className="flex items-center gap-2 font-semibold text-gray-100">
            <ShoppingCart className="h-4 w-4 text-blue-600" />
            Lista de Pedidos
          </h2>
        </div>

        {ordersLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-md bg-surface-3" />
            ))}
          </div>
        ) : !orders?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ShoppingCart className="mb-3 h-10 w-10 opacity-40" />
            <p className="text-sm">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/50 bg-surface-1">
                <tr className="text-left text-xs font-medium text-gray-500">
                  <th className="px-6 py-3">Consumível</th>
                  <th className="px-6 py-3">Quantidade</th>
                  <th className="px-6 py-3">Solicitado por</th>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-1">
                    <td className="px-6 py-4 font-medium text-gray-100">{order.items?.[0]?.product?.name ?? "—"}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {order.items?.[0]?.quantity ?? "-"} {order.items?.[0]?.product?.unit ?? ""}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{order.client?.name ?? "-"}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {format(new Date(order.createdAt), "d MMM yyyy", { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-400 max-w-xs truncate">
                      {order.notes ?? '—'}
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
