'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { List, Plus, FlaskConical, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import ShareQrModal from '@/components/ShareQrModal';

interface DesinfecaoRecord {
  id: string;
  data: string;
  generosAlimenticios: string;
  nomeDesinfetante: string;
  dose: string;
  quantidadeAgua: string;
  tempoAtuacao: string;
  observacoes?: string;
  operator: { name: string };
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function DesinfecaoPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'list' | 'new'>('list');
  const [showShare, setShowShare] = useState(false);

  const [generos, setGeneros] = useState('');
  const [desinfetante, setDesinfetante] = useState('');
  const [dose, setDose] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [tempo, setTempo] = useState('');
  const [obs, setObs] = useState('');

  const startDate = new Date(); startDate.setDate(startDate.getDate() - 30);

  const { data: records = [], isLoading } = useQuery<DesinfecaoRecord[]>({
    queryKey: ['app-desinfecao'],
    queryFn: () => api.get(`/registos/desinfecao?startDate=${startDate.toISOString().split('T')[0]}&endDate=${today()}`).then(r => r.data.data),
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => api.post('/registos/desinfecao', {
      data: today(),
      generosAlimenticios: generos.trim(),
      nomeDesinfetante: desinfetante.trim(),
      dose: dose.trim(),
      quantidadeAgua: quantidade.trim(),
      tempoAtuacao: tempo.trim(),
      observacoes: obs.trim() || undefined,
    }),
    onSuccess: () => {
      toast.success('Registo guardado!');
      setGeneros(''); setDesinfetante(''); setDose(''); setQuantidade(''); setTempo(''); setObs('');
      qc.invalidateQueries({ queryKey: ['app-desinfecao'] });
      setTab('list');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao guardar'),
  });

  function handleSubmit() {
    if (!generos.trim() || !desinfetante.trim() || !dose.trim() || !quantidade.trim() || !tempo.trim()) {
      toast.error('Preenche todos os campos obrigatórios');
      return;
    }
    submit();
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        <button onClick={() => setTab('list')} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${tab === 'list' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}>
          <List size={16} /> Histórico
        </button>
        <button onClick={() => setTab('new')} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${tab === 'new' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}>
          <Plus size={16} /> Novo Registo
        </button>
        {tab === 'list' && records.length > 0 && (
          <button onClick={() => setShowShare(true)} className="px-3 text-gray-400 hover:text-purple-600 border-l border-gray-100">
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
              <FlaskConical size={40} className="mb-2 opacity-30" />
              <p className="text-sm">Sem registos nos últimos 30 dias</p>
            </div>
          ) : records.map(r => (
            <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="font-semibold text-gray-900">{r.generosAlimenticios}</p>
              <p className="text-xs text-gray-500 mt-0.5">{r.nomeDesinfetante} · {r.dose} · {r.quantidadeAgua}</p>
              <p className="text-xs text-gray-500">Tempo: {r.tempoAtuacao}</p>
              <p className="text-xs text-gray-400 mt-1">{fmtDate(r.data)} · {r.operator.name}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'new' && (
        <div className="p-4 space-y-4">
          <p className="text-xs text-gray-400">Data: {new Date().toLocaleDateString('pt-PT')}</p>

          {[
            { label: 'Géneros Alimentícios a Desinfetar *', value: generos, set: setGeneros, placeholder: 'ex: Alface, Tomate, Pepino' },
            { label: 'Nome do Desinfetante *', value: desinfetante, set: setDesinfetante, placeholder: 'ex: Hipoclorito de Sódio' },
            { label: 'Dose Aplicada *', value: dose, set: setDose, placeholder: 'ex: 50 mg/L' },
            { label: 'Quantidade de Água *', value: quantidade, set: setQuantidade, placeholder: 'ex: 5 L' },
            { label: 'Tempo de Atuação *', value: tempo, set: setTempo, placeholder: 'ex: 5 minutos' },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="Opcional" rows={2}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
          </div>

          <button onClick={handleSubmit} disabled={isPending}
            className="w-full py-3 rounded-xl font-semibold text-white bg-purple-600 active:bg-purple-700 disabled:opacity-50">
            {isPending ? 'A guardar...' : 'Guardar Registo'}
          </button>
        </div>
      )}

      <ShareQrModal
        open={showShare}
        onClose={() => setShowShare(false)}
        variant="sheet"
        type="DESINFECAO"
        label="Desinfeção — últimos 30 dias"
        params={{
          startDate: startDate.toISOString().split('T')[0],
          endDate: today(),
        }}
        clientId={user?.clientId}
      />
    </div>
  );
}
