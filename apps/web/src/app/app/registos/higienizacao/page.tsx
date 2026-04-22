'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { List, Plus, SprayCan, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import ShareQrModal from '@/components/ShareQrModal';

interface HigienizacaoRecord {
  id: string;
  zona: string;
  dia: string;
  itens: Record<string, boolean>;
  observacoes?: string;
  operator: { name: string };
}

type Zona = 'COZINHA' | 'PRODUCAO' | 'ARMAZEM' | 'SERVICO';

const ZONAS: { key: Zona; label: string; emoji: string }[] = [
  { key: 'COZINHA', label: 'Cozinha', emoji: '🍳' },
  { key: 'PRODUCAO', label: 'Produção', emoji: '🏭' },
  { key: 'ARMAZEM', label: 'Armazém', emoji: '📦' },
  { key: 'SERVICO', label: 'Serviço', emoji: '🍽️' },
];

const ITENS_POR_ZONA: Record<Zona, string[]> = {
  COZINHA: ['Bancadas', 'Fogão', 'Forno', 'Fritadeira', 'Exaustor', 'Frigoríficos', 'Arcas', 'Equipamentos', 'Utensílios', 'Chão', 'Paredes', 'Teto', 'Lavatório', 'Esgotos'],
  PRODUCAO: ['Bancadas', 'Equipamentos', 'Utensílios', 'Frigoríficos', 'Arcas', 'Chão', 'Paredes', 'Teto', 'Lavatório'],
  ARMAZEM: ['Prateleiras', 'Chão', 'Paredes', 'Teto', 'Porta', 'Janelas'],
  SERVICO: ['Balcão', 'Mesas', 'Cadeiras', 'Chão', 'Paredes', 'Teto', 'Lavatório', 'WC'],
};

const PERIODO_OPTS = [
  { key: 'D', label: 'Diário' },
  { key: 'S', label: 'Semanal' },
  { key: 'T', label: 'Trimestral' },
] as const;

function today() { return new Date().toISOString().split('T')[0]; }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }); }

const ZONA_LABELS: Record<string, string> = { COZINHA: 'Cozinha', PRODUCAO: 'Produção', ARMAZEM: 'Armazém', SERVICO: 'Serviço' };

export default function HigienizacaoPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'list' | 'new'>('list');
  const [showShare, setShowShare] = useState(false);

  const [zona, setZona] = useState<Zona>('COZINHA');
  const [periodo, setPeriodo] = useState<'D' | 'S' | 'T'>('D');
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [obs, setObs] = useState('');

  const startDate = new Date(); startDate.setDate(startDate.getDate() - 30);

  const { data: records = [], isLoading } = useQuery<HigienizacaoRecord[]>({
    queryKey: ['app-higienizacao'],
    queryFn: () => api.get(`/registos/higienizacao?startDate=${startDate.toISOString().split('T')[0]}&endDate=${today()}`).then(r => r.data.data),
  });

  const itens = ITENS_POR_ZONA[zona];
  const checkedCount = itens.filter(i => checks[i]).length;

  function toggleZona(z: Zona) {
    setZona(z);
    setChecks({});
  }

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => {
      const itensFinal: Record<string, boolean> = {};
      itens.forEach(i => { itensFinal[i] = !!checks[i]; });
      return api.post('/registos/higienizacao', {
        zona,
        dia: today(),
        periodo,
        itens: itensFinal,
        observacoes: obs.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Registo guardado!');
      setChecks({}); setObs('');
      qc.invalidateQueries({ queryKey: ['app-higienizacao'] });
      setTab('list');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao guardar'),
  });

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        <button onClick={() => setTab('list')} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${tab === 'list' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}>
          <List size={16} /> Histórico
        </button>
        <button onClick={() => setTab('new')} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${tab === 'new' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}>
          <Plus size={16} /> Novo Registo
        </button>
        {tab === 'list' && records.length > 0 && (
          <button onClick={() => setShowShare(true)} className="px-3 text-gray-400 hover:text-green-600 border-l border-gray-100">
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
              <SprayCan size={40} className="mb-2 opacity-30" />
              <p className="text-sm">Sem registos nos últimos 30 dias</p>
            </div>
          ) : records.map(r => {
            const total = Object.keys(r.itens).length;
            const done = Object.values(r.itens).filter(Boolean).length;
            return (
              <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{ZONA_LABELS[r.zona] ?? r.zona}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{fmtDate(r.dia)} · {r.operator.name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${done === total ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {done}/{total}
                  </span>
                </div>
                <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'new' && (
        <div className="p-4 space-y-4">
          <p className="text-xs text-gray-400">Data: {new Date().toLocaleDateString('pt-PT')}</p>

          {/* Zona */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Zona</p>
            <div className="grid grid-cols-2 gap-2">
              {ZONAS.map(z => (
                <button key={z.key} type="button" onClick={() => toggleZona(z.key)}
                  className={`py-3 rounded-xl border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${zona === z.key ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                  <span>{z.emoji}</span> {z.label}
                </button>
              ))}
            </div>
          </div>

          {/* Período */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Período</p>
            <div className="flex gap-2">
              {PERIODO_OPTS.map(p => (
                <button key={p.key} type="button" onClick={() => setPeriodo(p.key)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${periodo === p.key ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Itens ({checkedCount}/{itens.length})</p>
              <button type="button" onClick={() => {
                const allChecked = checkedCount === itens.length;
                const newChecks: Record<string, boolean> = {};
                itens.forEach(i => { newChecks[i] = !allChecked; });
                setChecks(newChecks);
              }} className="text-xs text-green-600 font-medium">
                {checkedCount === itens.length ? 'Desmarcar todos' : 'Marcar todos'}
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
              {itens.map(item => (
                <label key={item} className="flex items-center gap-3 px-4 py-3 active:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={!!checks[item]} onChange={e => setChecks(c => ({ ...c, [item]: e.target.checked }))}
                    className="w-4 h-4 rounded accent-green-600" />
                  <span className="text-sm text-gray-700">{item}</span>
                </label>
              ))}
            </div>

            <div className="mt-2 bg-gray-100 rounded-full h-1.5">
              <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${itens.length ? (checkedCount / itens.length) * 100 : 0}%` }} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="Opcional" rows={2}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>

          <button onClick={() => submit()} disabled={isPending}
            className="w-full py-3 rounded-xl font-semibold text-white bg-green-600 active:bg-green-700 disabled:opacity-50">
            {isPending ? 'A guardar...' : 'Guardar Registo'}
          </button>
        </div>
      )}

      <ShareQrModal
        open={showShare}
        onClose={() => setShowShare(false)}
        variant="sheet"
        type="HIGIENIZACAO"
        label="Higienização — últimos 30 dias"
        params={{
          startDate: startDate.toISOString().split('T')[0],
          endDate: today(),
        }}
        clientId={user?.clientId}
      />
    </div>
  );
}
