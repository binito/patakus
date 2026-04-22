'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { List, Plus, PackageCheck, PackageX, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import ShareQrModal from '@/components/ShareQrModal';

interface EntradaRecord {
  id: string;
  data: string;
  materiaPrima: string;
  fornecedor: string;
  faturaN?: string;
  veiculoOk: boolean;
  embalagemOk: boolean;
  rotulagemOk: boolean;
  produtoOk: boolean;
  temperatura?: number;
  lote?: string;
  operator: { name: string };
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const CHECKS = [
  { key: 'veiculoOk', label: 'Veículo Conforme' },
  { key: 'embalagemOk', label: 'Embalagem Conforme' },
  { key: 'rotulagemOk', label: 'Rotulagem Conforme' },
  { key: 'produtoOk', label: 'Produto Conforme' },
] as const;

type CheckKey = typeof CHECKS[number]['key'];

export default function EntradasPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'list' | 'new'>('list');
  const [showShare, setShowShare] = useState(false);

  const [materiaPrima, setMateriaPrima] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [faturaN, setFaturaN] = useState('');
  const [checks, setChecks] = useState<Record<CheckKey, boolean>>({ veiculoOk: true, embalagemOk: true, rotulagemOk: true, produtoOk: true });
  const [temperatura, setTemperatura] = useState('');
  const [lote, setLote] = useState('');

  const startDate = new Date(); startDate.setDate(startDate.getDate() - 30);

  const { data: records = [], isLoading } = useQuery<EntradaRecord[]>({
    queryKey: ['app-entradas'],
    queryFn: () => api.get(`/registos/entradas?startDate=${startDate.toISOString().split('T')[0]}&endDate=${today()}`).then(r => r.data.data),
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => api.post('/registos/entradas', {
      data: today(),
      materiaPrima: materiaPrima.trim(),
      fornecedor: fornecedor.trim(),
      faturaN: faturaN.trim() || undefined,
      ...checks,
      temperatura: temperatura ? parseFloat(temperatura.replace(',', '.')) : undefined,
      lote: lote.trim() || undefined,
    }),
    onSuccess: () => {
      toast.success('Registo guardado!');
      setMateriaPrima(''); setFornecedor(''); setFaturaN('');
      setChecks({ veiculoOk: true, embalagemOk: true, rotulagemOk: true, produtoOk: true });
      setTemperatura(''); setLote('');
      qc.invalidateQueries({ queryKey: ['app-entradas'] });
      setTab('list');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao guardar'),
  });

  function handleSubmit() {
    if (!materiaPrima.trim() || !fornecedor.trim()) {
      toast.error('Matéria prima e fornecedor são obrigatórios');
      return;
    }
    submit();
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        <button onClick={() => setTab('list')} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${tab === 'list' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
          <List size={16} /> Histórico
        </button>
        <button onClick={() => setTab('new')} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${tab === 'new' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
          <Plus size={16} /> Nova Entrada
        </button>
        {tab === 'list' && records.length > 0 && (
          <button onClick={() => setShowShare(true)} className="px-3 text-gray-400 hover:text-blue-600 border-l border-gray-100">
            <QrCode size={18} />
          </button>
        )}
      </div>

      {tab === 'list' && (
        <div className="p-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)
          ) : !records.length ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <PackageCheck size={40} className="mb-2 opacity-30" />
              <p className="text-sm">Sem registos nos últimos 30 dias</p>
            </div>
          ) : records.map(r => {
            const allOk = r.veiculoOk && r.embalagemOk && r.rotulagemOk && r.produtoOk;
            return (
              <div key={r.id} className={`bg-white rounded-xl p-4 shadow-sm border ${allOk ? 'border-gray-100' : 'border-l-4 border-l-red-500 border-gray-100'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{r.materiaPrima}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.fornecedor}{r.faturaN ? ` · Fatura ${r.faturaN}` : ''}</p>
                    <p className="text-xs text-gray-400 mt-1">{fmtDate(r.data)} · {r.operator.name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${allOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {allOk ? '✓ OK' : '⚠ NC'}
                    </span>
                    {r.temperatura != null && <span className="text-xs text-gray-500 font-medium">{r.temperatura}°C</span>}
                  </div>
                </div>
                {!allOk && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {!r.veiculoOk && <span className="text-xs bg-red-50 text-red-600 rounded px-1.5 py-0.5">Veículo NC</span>}
                    {!r.embalagemOk && <span className="text-xs bg-red-50 text-red-600 rounded px-1.5 py-0.5">Embalagem NC</span>}
                    {!r.rotulagemOk && <span className="text-xs bg-red-50 text-red-600 rounded px-1.5 py-0.5">Rotulagem NC</span>}
                    {!r.produtoOk && <span className="text-xs bg-red-50 text-red-600 rounded px-1.5 py-0.5">Produto NC</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'new' && (
        <div className="p-4 space-y-4">
          <p className="text-xs text-gray-400">Data: {new Date().toLocaleDateString('pt-PT')}</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Matéria Prima *</label>
            <input value={materiaPrima} onChange={e => setMateriaPrima(e.target.value)} placeholder="ex: Alface, Carne de frango"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor *</label>
            <input value={fornecedor} onChange={e => setFornecedor(e.target.value)} placeholder="Nome do fornecedor"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fatura N.º</label>
            <input value={faturaN} onChange={e => setFaturaN(e.target.value)} placeholder="Opcional"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Nível de Higiene e Segurança</p>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
              {CHECKS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-700">{label}</span>
                  <button
                    type="button"
                    onClick={() => setChecks(c => ({ ...c, [key]: !c[key] }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${checks[key] ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  >
                    {checks[key] ? <PackageCheck size={14} /> : <PackageX size={14} />}
                    {checks[key] ? 'Conforme' : 'Não Conforme'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperatura (°C)</label>
            <input value={temperatura} onChange={e => setTemperatura(e.target.value)} placeholder="ex: 4.5" inputMode="decimal"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lote do Produto</label>
            <input value={lote} onChange={e => setLote(e.target.value)} placeholder="Opcional"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <button onClick={handleSubmit} disabled={isPending}
            className="w-full py-3 rounded-xl font-semibold text-white bg-blue-600 active:bg-blue-700 disabled:opacity-50">
            {isPending ? 'A guardar...' : 'Guardar Registo'}
          </button>
        </div>
      )}

      <ShareQrModal
        open={showShare}
        onClose={() => setShowShare(false)}
        variant="sheet"
        type="ENTRADAS"
        label="Entradas — últimos 30 dias"
        params={{
          startDate: startDate.toISOString().split('T')[0],
          endDate: today(),
        }}
        clientId={user?.clientId}
      />
    </div>
  );
}
