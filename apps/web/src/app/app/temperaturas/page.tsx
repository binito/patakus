'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Thermometer, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface TodayRecord {
  temperature: number;
  recordedAt: string;
}

interface Equipment {
  id: string;
  name: string;
  type: 'FRIDGE' | 'FREEZER';
  location?: string;
  minTemp?: number;
  maxTemp?: number;
  today: {
    morning: TodayRecord | null;
    evening: TodayRecord | null;
  };
}

type Session = 'MORNING' | 'EVENING';

function currentSession(): Session {
  return new Date().getHours() < 13 ? 'MORNING' : 'EVENING';
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

function tempOk(temp: number, min?: number, max?: number) {
  if (min !== undefined && temp < min) return false;
  if (max !== undefined && temp > max) return false;
  return true;
}

export default function TemperaturasPage() {
  const qc = useQueryClient();

  const { data: equipment = [], isLoading, refetch } = useQuery<Equipment[]>({
    queryKey: ['app-temperature-today'],
    queryFn: () => api.get('/temperature/today').then(r => r.data),
    refetchInterval: 60_000,
  });

  // Modal state
  const [sheet, setSheet] = useState<{ eq: Equipment; session: Session } | null>(null);
  const [tempInput, setTempInput] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function openSheet(eq: Equipment, session: Session) {
    setSheet({ eq, session });
    setTempInput('');
    setNotes('');
  }

  const submit = useCallback(async () => {
    if (!sheet) return;
    const temp = parseFloat(tempInput.replace(',', '.'));
    if (isNaN(temp)) { toast.error('Temperatura inválida'); return; }

    setSubmitting(true);
    try {
      await api.post('/temperature/records', {
        equipmentId: sheet.eq.id,
        temperature: temp,
        session: sheet.session,
        notes: notes.trim() || undefined,
      });
      toast.success('Temperatura registada!');
      setSheet(null);
      qc.invalidateQueries({ queryKey: ['app-temperature-today'] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro ao guardar');
    } finally {
      setSubmitting(false);
    }
  }, [sheet, tempInput, notes, qc]);

  const total = equipment.length;
  const complete = equipment.filter(e => e.today.morning && e.today.evening).length;
  const pending = total - complete;

  return (
    <>
      <div className="p-4 space-y-4">
        {/* Resumo */}
        {total > 0 && (
          <div className={`rounded-xl p-4 ${pending === 0 ? 'bg-green-600' : 'bg-blue-600'} text-white`}>
            <p className="font-bold text-base">Controlo de Temperatura</p>
            <p className="text-sm mt-1 opacity-90">
              {pending === 0
                ? 'Todos os registos de hoje estão completos ✓'
                : `${pending} equipamento${pending !== 1 ? 's' : ''} com registos em falta`}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        )}

        {!isLoading && equipment.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Thermometer size={40} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhum equipamento configurado</p>
          </div>
        )}

        {equipment.map(eq => (
          <div key={eq.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header do card */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${eq.type === 'FREEZER' ? 'bg-blue-100' : 'bg-cyan-100'}`}>
                <Thermometer size={20} className={eq.type === 'FREEZER' ? 'text-blue-600' : 'text-cyan-600'} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{eq.name}</p>
                <p className="text-xs text-gray-400">
                  {eq.type === 'FREEZER' ? 'Arca / Congelador' : 'Frigorífico'}
                  {eq.location ? ` · ${eq.location}` : ''}
                  {(eq.minTemp != null || eq.maxTemp != null) ? ` · ${eq.minTemp ?? '—'}°C a ${eq.maxTemp ?? '—'}°C` : ''}
                </p>
              </div>
            </div>

            {/* Botões de sessão */}
            <div className="grid grid-cols-2 gap-px bg-gray-100 border-t border-gray-100">
              {(['morning', 'evening'] as const).map(sess => {
                const record = eq.today[sess];
                const sessionKey: Session = sess === 'morning' ? 'MORNING' : 'EVENING';
                const label = sess === 'morning' ? '🌅 Manhã' : '🌙 Tarde';
                const ok = record ? tempOk(record.temperature, eq.minTemp, eq.maxTemp) : null;

                return (
                  <button
                    key={sess}
                    type="button"
                    onClick={() => openSheet(eq, sessionKey)}
                    className="bg-white active:bg-gray-50 flex flex-col items-center justify-center py-4 gap-1"
                  >
                    <span className="text-xs text-gray-500 font-medium">{label}</span>
                    {record ? (
                      <>
                        <span className={`text-xl font-bold ${ok ? 'text-green-600' : 'text-red-600'}`}>
                          {record.temperature}°C
                        </span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <CheckCircle2 size={11} className="text-green-500" />
                          {fmtTime(record.recordedAt)}
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock size={20} className="text-gray-300" />
                        <span className="text-xs text-gray-400">Por registar</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom sheet modal */}
      {sheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50" onClick={() => setSheet(null)}>
          <div className="bg-white rounded-t-2xl p-6 pb-10 space-y-4" onClick={e => e.stopPropagation()}>
            {/* Handle */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto -mt-2 mb-2" />

            <div>
              <p className="font-bold text-gray-900 text-lg">{sheet.eq.name}</p>
              <p className="text-sm text-gray-500">
                {sheet.session === 'MORNING' ? '🌅 Manhã' : '🌙 Tarde'}
              </p>
            </div>

            {/* Selector de sessão */}
            <div className="flex gap-2">
              {(['MORNING', 'EVENING'] as Session[]).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSheet(prev => prev ? { ...prev, session: s } : null)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    sheet.session === s
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  {s === 'MORNING' ? '🌅 Manhã' : '🌙 Tarde'}
                </button>
              ))}
            </div>

            {/* Input temperatura */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Temperatura (°C)</label>
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder="ex: 4.5"
                value={tempInput}
                onChange={e => setTempInput(e.target.value)}
                autoFocus
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-3xl font-bold text-center text-gray-900 focus:outline-none focus:border-blue-500"
              />
              {(sheet.eq.minTemp != null || sheet.eq.maxTemp != null) && (
                <p className="text-xs text-center text-gray-400 mt-1">
                  Intervalo: {sheet.eq.minTemp ?? '—'}°C a {sheet.eq.maxTemp ?? '—'}°C
                </p>
              )}
            </div>

            {/* Notas */}
            <input
              type="text"
              placeholder="Observação (opcional)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="button"
              onClick={submit}
              disabled={submitting || !tempInput}
              className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-base active:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'A guardar...' : 'Guardar registo'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
