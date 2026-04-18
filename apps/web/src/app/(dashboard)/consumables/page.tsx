'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, AlertTriangle, Plus, Trash2, ChevronDown, CheckCircle2,
  Truck, Clock, X,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';

interface Product { id: string; name: string; unit: string; sku?: string; }
interface Client { id: string; name: string; }
interface StockRow {
  id: string; quantity: number; minQuantity: number;
  clientId: string; productId: string;
  product?: Product;
  client?: { id: string; name: string };
}
interface ShortageReport {
  id: string; quantity?: number; notes?: string;
  status: 'OPEN' | 'ORDERED' | 'RESOLVED';
  createdAt: string;
  stockId: string;
  stock?: { product?: Product; clientId: string };
  reporter?: { name: string };
  client?: { name: string };
}

const statusConfig = {
  OPEN:     { label: 'Em aberto',        color: 'bg-red-100 text-red-700',    icon: Clock },
  ORDERED:  { label: 'Em processamento', color: 'bg-yellow-100 text-yellow-700', icon: Truck },
  RESOLVED: { label: 'Entregue',         color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
};

const nextStatus: Record<string, { status: string; label: string } | null> = {
  OPEN:     { status: 'ORDERED',  label: 'Marcar em processamento' },
  ORDERED:  { status: 'RESOLVED', label: 'Marcar como entregue' },
  RESOLVED: null,
};

export default function ConsumablesPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [tab, setTab] = useState<'stock' | 'reports'>('stock');
  const [selectedClient, setSelectedClient] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [addProductId, setAddProductId] = useState('');
  const [addProductName, setAddProductName] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productDropOpen, setProductDropOpen] = useState(false);
  const [addQty, setAddQty] = useState<number>(0);
  const [addMin, setAddMin] = useState<number>(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const [reportFilter, setReportFilter] = useState<'ALL' | 'OPEN' | 'ORDERED' | 'RESOLVED'>('ALL');

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: clients } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then(r => r.data),
    enabled: isSuperAdmin,
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
    enabled: isSuperAdmin && addModal,
  });

  // Stock do cliente seleccionado (ou do próprio cliente)
  const stockClientId = isSuperAdmin ? selectedClient : (user?.clientId ?? '');
  const { data: stock, isLoading: stockLoading } = useQuery<StockRow[]>({
    queryKey: ['consumables-stock', stockClientId],
    queryFn: () => api.get(`/consumables/stock${stockClientId ? `?clientId=${stockClientId}` : ''}`).then(r => r.data),
    enabled: !!stockClientId,
  });

  // Relatórios de falta
  const { data: reports, isLoading: reportsLoading } = useQuery<ShortageReport[]>({
    queryKey: ['consumables-reports'],
    queryFn: () => api.get('/consumables/reports').then(r => r.data),
    enabled: tab === 'reports',
  });

  // ── Mutações ─────────────────────────────────────────────────────────────

  const { mutate: addStock, isPending: isAdding } = useMutation({
    mutationFn: () => api.patch('/consumables/stock', {
      clientId: selectedClient,
      productId: addProductId,
      quantity: addQty,
      minQuantity: addMin,
    }),
    onSuccess: () => {
      toast.success('Produto atribuído!');
      qc.invalidateQueries({ queryKey: ['consumables-stock'] });
      setAddModal(false);
      setAddProductId(''); setAddQty(0); setAddMin(0);
    },
    onError: () => toast.error('Erro ao atribuir produto'),
  });

  const { mutate: removeStock } = useMutation({
    mutationFn: (id: string) => api.delete(`/consumables/stock/${id}`),
    onSuccess: () => {
      toast.success('Produto removido');
      qc.invalidateQueries({ queryKey: ['consumables-stock'] });
    },
    onError: () => toast.error('Erro ao remover produto'),
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/consumables/reports/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Estado actualizado');
      qc.invalidateQueries({ queryKey: ['consumables-reports'] });
    },
    onError: () => toast.error('Erro ao actualizar estado'),
  });

  // ── Derived ───────────────────────────────────────────────────────────────

  const filteredReports = reports?.filter(r =>
    reportFilter === 'ALL' || r.status === reportFilter
  ) ?? [];

  const openCount = reports?.filter(r => r.status === 'OPEN').length ?? 0;

  const assignedProductIds = new Set(stock?.map(s => s.productId) ?? []);
  const availableProducts = products?.filter(p => !assignedProductIds.has(p.id)) ?? [];

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Consumíveis</h1>
        <p className="text-sm text-gray-500">Gestão de produtos atribuídos e faltas reportadas</p>
      </div>

      {/* Alerta de faltas em aberto */}
      {openCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
          <p className="text-sm font-medium text-orange-700">
            {openCount} falta{openCount !== 1 ? 's' : ''} reportada{openCount !== 1 ? 's' : ''} em aberto
          </p>
          <button
            type="button"
            onClick={() => setTab('reports')}
            className="ml-auto text-xs font-medium text-orange-700 underline hover:no-underline"
          >
            Ver faltas
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {([
          { key: 'stock', label: 'Produtos atribuídos' },
          { key: 'reports', label: `Faltas reportadas${openCount > 0 ? ` (${openCount})` : ''}` },
        ] as const).map(t => (
          <button
            type="button"
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Stock ── */}
      {tab === 'stock' && (
        <div className="space-y-4">
          {/* Super admin: selector de cliente + botão adicionar */}
          {isSuperAdmin && (
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <select
                  value={selectedClient}
                  onChange={e => setSelectedClient(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clients?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              {selectedClient && (
                <Button
                  onClick={() => setAddModal(true)}
                  className="flex items-center gap-2 shrink-0"
                >
                  <Plus className="h-4 w-4" /> Atribuir produto
                </Button>
              )}
            </div>
          )}

          {/* Tabela de stock */}
          <Card padding="none">
            {!stockClientId ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Package className="mb-3 h-10 w-10 opacity-40" />
                <p className="text-sm">Selecciona um cliente para ver os seus produtos</p>
              </div>
            ) : stockLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-12 animate-pulse rounded-md bg-gray-100" />)}
              </div>
            ) : !stock?.length ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Package className="mb-3 h-10 w-10 opacity-40" />
                <p className="text-sm">Nenhum produto atribuído</p>
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => setAddModal(true)}
                    className="mt-3 text-sm text-blue-600 hover:underline"
                  >
                    Atribuir primeiro produto
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr className="text-left text-xs font-medium text-gray-500">
                      <th className="px-6 py-3">Produto</th>
                      <th className="px-6 py-3">SKU</th>
                      <th className="px-6 py-3">Qtd. actual</th>
                      <th className="px-6 py-3">Qtd. mínima</th>
                      <th className="px-6 py-3">Situação</th>
                      {isSuperAdmin && <th className="px-6 py-3"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stock.map(s => {
                      const low = s.quantity <= s.minQuantity;
                      const pct = s.minQuantity > 0 ? Math.min((s.quantity / s.minQuantity) * 100, 100) : 100;
                      return (
                        <tr key={s.id} className={low ? 'bg-red-50/60' : 'hover:bg-gray-50'}>
                          <td className="px-6 py-4 font-medium text-gray-900">{s.product?.name}</td>
                          <td className="px-6 py-4 text-gray-400 text-xs">{s.product?.sku ?? '—'}</td>
                          <td className="px-6 py-4">
                            <span className={`font-semibold ${low ? 'text-red-600' : 'text-gray-900'}`}>
                              {s.quantity} <span className="font-normal text-gray-400 text-xs">{s.product?.unit}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">{s.minQuantity} {s.product?.unit}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 rounded-full bg-gray-200 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${pct < 50 ? 'bg-red-500' : pct < 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              {low && <span className="text-xs font-medium text-red-600">Em falta</span>}
                            </div>
                          </td>
                          {isSuperAdmin && (
                            <td className="px-6 py-4">
                              <button
                                type="button"
                                onClick={() => removeStock(s.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors"
                                title="Remover produto"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Tab: Faltas Reportadas ── */}
      {tab === 'reports' && (
        <div className="space-y-3">
          {/* Filtro por estado */}
          <div className="flex gap-2 flex-wrap">
            {(['ALL', 'OPEN', 'ORDERED', 'RESOLVED'] as const).map(s => (
              <button
                type="button"
                key={s}
                onClick={() => setReportFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  reportFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s === 'ALL' ? 'Todos' : statusConfig[s].label}
              </button>
            ))}
          </div>

          {reportsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />)}
            </div>
          ) : !filteredReports.length ? (
            <Card>
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <CheckCircle2 className="mb-3 h-10 w-10 opacity-40" />
                <p className="text-sm">Nenhuma falta reportada</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredReports.map(r => {
                const cfg = statusConfig[r.status];
                const next = nextStatus[r.status];
                const clientName = clients?.find(c => c.id === r.stock?.clientId)?.name;
                return (
                  <Card key={r.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm">
                            {r.stock?.product?.name ?? '—'}
                          </p>
                          {isSuperAdmin && clientName && (
                            <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                              {clientName}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                          {r.quantity != null && (
                            <span>{r.quantity} {r.stock?.product?.unit ?? ''} pedido{r.quantity !== 1 ? 's' : ''}</span>
                          )}
                          {r.reporter?.name && <span>por {r.reporter.name}</span>}
                          <span>{format(new Date(r.createdAt), "d MMM yyyy 'às' HH:mm", { locale: pt })}</span>
                        </div>
                        {r.notes && (
                          <p className="text-xs text-gray-400 italic">"{r.notes}"</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
                          <cfg.icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                        {isSuperAdmin && next && (
                          <button
                            type="button"
                            onClick={() => updateStatus({ id: r.id, status: next.status })}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            {next.label}
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal — atribuir produto */}
      {isSuperAdmin && (
        <Modal
          open={addModal}
          onClose={() => {
            setAddModal(false);
            setAddProductId(''); setAddProductName('');
            setProductSearch(''); setProductDropOpen(false);
            setAddQty(0); setAddMin(0);
          }}
          title="Atribuir produto ao cliente"
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Produto *</label>

              {/* Combobox com pesquisa */}
              <div className="relative">
                <div
                  className={`flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm cursor-text ${
                    productDropOpen ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300'
                  }`}
                  onClick={() => { setProductDropOpen(true); setTimeout(() => searchRef.current?.focus(), 0); }}
                >
                  {addProductId ? (
                    <>
                      <span className="flex-1 text-gray-900">{addProductName}</span>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setAddProductId(''); setAddProductName('');
                          setProductSearch(''); setProductDropOpen(true);
                          setTimeout(() => searchRef.current?.focus(), 0);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <input
                      ref={searchRef}
                      type="text"
                      value={productSearch}
                      onChange={e => { setProductSearch(e.target.value); setProductDropOpen(true); }}
                      onFocus={() => setProductDropOpen(true)}
                      placeholder="Pesquisar produto..."
                      className="flex-1 bg-transparent outline-none placeholder-gray-400"
                    />
                  )}
                  <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                </div>

                {/* Dropdown lista */}
                {productDropOpen && !addProductId && (
                  <>
                    {/* overlay para fechar ao clicar fora */}
                    <div className="fixed inset-0 z-10" onClick={() => setProductDropOpen(false)} />
                    <ul className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-52 overflow-y-auto text-sm">
                      {availableProducts
                        .filter(p =>
                          productSearch === '' ||
                          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                          (p.sku ?? '').toLowerCase().includes(productSearch.toLowerCase())
                        )
                        .map(p => (
                          <li
                            key={p.id}
                            onClick={() => {
                              setAddProductId(p.id);
                              setAddProductName(`${p.name} (${p.unit})`);
                              setProductSearch('');
                              setProductDropOpen(false);
                            }}
                            className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-blue-50"
                          >
                            <span className="text-gray-900">{p.name}</span>
                            <span className="text-xs text-gray-400">{p.sku ?? p.unit}</span>
                          </li>
                        ))}
                      {availableProducts.filter(p =>
                        productSearch === '' ||
                        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                        (p.sku ?? '').toLowerCase().includes(productSearch.toLowerCase())
                      ).length === 0 && (
                        <li className="px-3 py-3 text-gray-400 text-center">Nenhum produto encontrado</li>
                      )}
                    </ul>
                  </>
                )}
              </div>

              {availableProducts.length === 0 && products && (
                <p className="mt-1 text-xs text-gray-400">Todos os produtos já estão atribuídos a este cliente.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qtd. actual</label>
                <input
                  type="number"
                  min={0}
                  value={addQty}
                  onChange={e => setAddQty(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qtd. mínima</label>
                <input
                  type="number"
                  min={0}
                  value={addMin}
                  onChange={e => setAddMin(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Quando a quantidade actual descer abaixo do mínimo, o sistema alerta para falta de stock.
            </p>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <Button variant="ghost" onClick={() => setAddModal(false)}>Cancelar</Button>
              <Button
                onClick={() => addStock()}
                loading={isAdding}
                disabled={!addProductId}
              >
                Atribuir
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
