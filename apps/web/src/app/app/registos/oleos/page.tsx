'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { List, Plus, Flame } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface OleoRecord {
  id: string;
  data: string;
  fritadeira: string;
  temperatura: number;
  resultado: number;
  acoes?: string;
  responsavel: { name: string };
}

const RESULTADO_OPTS = [
  { value: 1, label: '1 – Bom (<5%)', active: 'bg-green-600 text-white border-green-600', inactive: 'bg-white text-green-700 border-green-300' },
  { value: 2, label: '2 – Aceitável (5–10%)', active: 'bg-blue-600 text-white border-blue-600', inactive: 'bg-white text-blue-700 border-blue-300' },
  { value: 3, label: '3 – Atenção (11–17%)', active: 'bg-amber-500 text-white border-amber-500', inactive: 'bg-white text-amber-700 border-amber-300' },
  { value: 4, label: '4 – Mau (18–24%)', active: 'bg-orange-600 text-white border-orange-600', inactive: 'bg-white text-orange-700 border-orange-300' },
  { value: 5, label: '5 – Substituir (>24%)', active: 'bg-red-600 text-white border-red-600', inactive: 'bg-white text-red-700 border-red-300' },
];

const RESULTADO_BADGE: Record<number, string> = {
  1: 'bg-green-100 text-green-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-amber-100 text-amber-700',
  4: 'bg-orange-100 text-orange-700',
  5: 'bg-red-100 text-red-700',
};

const RESULTADO_LABEL: Record<number, string> = { 1: 'Bom', 2: 'Aceitável', 3: 'Atenção', 4: 'Mau', 5: 'Substituir' };

function today() { return new Date().toISOString().split('T')[0]; }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }); }

export default function OleosPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'list' | 'new'>('list');

  const [fritadeira, setFritadeira] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [resultado, setResultado] = useState(1);
  const [acoes, setAcoes] = useState('');

  const startDate = new Date(); startDate.setDate(startDate.getDate() - 30);

  const { data: records = [], isLoading } = useQuery<OleoRecord[]>({
    queryKey: ['app-oleos'],
    queryFn: () => api.get(`/registos/oleos?startDate=${startDate.toISOString().split('T')[0]}&endDate=${today()}`).then(r => r.data.data),
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => {
      const temp = parseFloat(temperatura.replace(',', '.'));
      return api.post('/registos/oleos', {
        data: today(),
        fritadeira: fritadeira.trim(),
        temperatura: temp,
        resultado,
        acoes: acoes.trim() || undefined,
      });
    },
    onSuccess: () => {
      const msg = resultado >= 4 ? 'Registo guardado. Toma as ações necessárias!' : 'Registo guardado!';
      toast.success(msg);
      setFritadeira(''); setTemperatura(''); setResultado(1); setAcoes('');
      qc.invalidateQueries({ queryKey: ['app-oleos'] });
      setTab('list');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao guardar'),
  });

  function handleSubmit() {
    if (!fritadeira.trim() || !temperatura.trim()) {
      toast.error('Fritadeira e temperatura são obrigatórios');
      return;
    }
    const temp = parseFloat(temperatura.replace(',', '.'));
    if (isNaN(temp)) { toast.error('Temperatura inválida'); return; }
    submit();
  }

  const alertCount = records.filter(r => r.resultado >= 4).length;

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        <button onClick={() => setTab('list')} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${tab === 'list' ? 'border-b-2 border-amber-600 text-amber-600' : 'text-gray-500'}`}>
          <List size={16} /> Histórico
        </button>
        <button onClick={() => setTab('new')} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${tab === 'new' ? 'border-b-2 border-amber-600 text-amber-600' : 'text-gray-500'}`}>
          <Plus size={16} /> Novo Registo
        </button>
      </div>

      {tab === 'list' && (
        <div className="p-4 space-y-3">
          {alertCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
              ⚠ {alertCount} registo{alertCount !== 1 ? 's' : ''} com resultado crítico nos últimos 30 dias
            </div>
          )}
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)
          ) : !records.length ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <Flame size={40} className="mb-2 opacity-30" />
              <p className="text-sm">Sem registos nos últimos 30 dias</p>
            </div>
          ) : records.map(r => (
            <div key={r.id} className={`bg-white rounded-xl p-4 shadow-sm border ${r.resultado >= 4 ? 'border-l-4 border-l-red-500 border-gray-100' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{r.fritadeira}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.temperatura}°C</p>
                  <p className="text-xs text-gray-400 mt-1">{fmtDate(r.data)} · {r.responsavel.name}</p>
                  {r.acoes && <p className="text-xs text-gray-500 mt-1 italic">{r.acoes}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg font-semibold whitespace-nowrap ${RESULTADO_BADGE[r.resultado]}`}>
                  {r.resultado} – {RESULTADO_LABEL[r.resultado]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'new' && (
        <div className="p-4 space-y-4">
          <p className="text-xs text-gray-400">Data: {new Date().toLocaleDateString('pt-PT')}</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fritadeira *</label>
            <input value={fritadeira} onChange={e => setFritadeira(e.target.value)} placeholder="ex: Fritadeira 1"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperatura (°C) *</label>
            <input value={temperatura} onChange={e => setTemperatura(e.target.value)} placeholder="ex: 180" inputMode="decimal"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Resultado (Compostos Polares) *</p>
            <div className="space-y-2">
              {RESULTADO_OPTS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setResultado(opt.value)}
                  className={`w-full py-3 rounded-xl border text-sm font-medium transition-colors ${resultado === opt.value ? opt.active : opt.inactive}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {resultado >= 4 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
              ⚠ Resultado crítico — regista as ações tomadas abaixo.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ações Tomadas</label>
            <textarea value={acoes} onChange={e => setAcoes(e.target.value)} placeholder="ex: Óleo substituído" rows={2}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
          </div>

          <button onClick={handleSubmit} disabled={isPending}
            className="w-full py-3 rounded-xl font-semibold text-white bg-amber-600 active:bg-amber-700 disabled:opacity-50">
            {isPending ? 'A guardar...' : 'Guardar Registo'}
          </button>
        </div>
      )}
    </div>
  );
}
