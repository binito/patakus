'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, List, Plus, Pencil, Trash2, X, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Area, ChecklistTemplate } from '@/types';

const FREQ_OPTS = [
  { value: 'DAILY', label: 'Diária' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensal' },
] as const;

const FREQ_COLOR: Record<string, string> = {
  DAILY: 'bg-blue-100 text-blue-700',
  WEEKLY: 'bg-purple-100 text-purple-700',
  MONTHLY: 'bg-orange-100 text-orange-700',
};

interface TaskDraft { id: string; description: string }

let seq = 0;
const uid = () => `t-${++seq}`;

type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

function emptyForm(): { name: string; frequency: Frequency; areaId: string } {
  return { name: '', frequency: 'DAILY', areaId: '' };
}

export default function ChecklistsGestaoPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'list' | 'form'>('list');
  const [editing, setEditing] = useState<ChecklistTemplate | null>(null);
  const [form, setForm] = useState<{ name: string; frequency: Frequency; areaId: string }>(emptyForm());
  const [tasks, setTasks] = useState<TaskDraft[]>([{ id: uid(), description: '' }]);
  const newTaskRef = useRef<HTMLInputElement>(null);

  const { data: templates = [], isLoading } = useQuery<ChecklistTemplate[]>({
    queryKey: ['app-gestao-checklist-templates'],
    queryFn: () => api.get('/checklists/templates').then(r => r.data),
  });

  const { data: areas = [] } = useQuery<Area[]>({
    queryKey: ['areas'],
    queryFn: () => api.get('/areas').then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const body = {
        ...form,
        tasks: tasks
          .filter(t => t.description.trim())
          .map((t, i) => ({ description: t.description.trim(), order: i + 1 })),
      };
      return editing
        ? api.patch(`/checklists/templates/${editing.id}`, body)
        : api.post('/checklists/templates', body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app-gestao-checklist-templates'] });
      qc.invalidateQueries({ queryKey: ['app-checklist-templates'] });
      toast.success(editing ? 'Checklist atualizada!' : 'Checklist criada!');
      closeForm();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao guardar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/checklists/templates/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app-gestao-checklist-templates'] });
      qc.invalidateQueries({ queryKey: ['app-checklist-templates'] });
      toast.success('Checklist eliminada');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao eliminar'),
  });

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setTasks([{ id: uid(), description: '' }]);
    setTab('form');
  }

  function openEdit(tpl: ChecklistTemplate) {
    setEditing(tpl);
    setForm({ name: tpl.name, frequency: tpl.frequency as Frequency, areaId: tpl.areaId });
    setTasks(
      tpl.tasks?.length
        ? tpl.tasks.map(t => ({ id: t.id, description: t.description }))
        : [{ id: uid(), description: '' }],
    );
    setTab('form');
  }

  function closeForm() {
    setTab('list');
    setEditing(null);
  }

  function handleDelete(tpl: ChecklistTemplate) {
    if (!window.confirm(`Eliminar "${tpl.name}"?`)) return;
    deleteMutation.mutate(tpl.id);
  }

  function addTask() {
    setTasks(t => [...t, { id: uid(), description: '' }]);
    setTimeout(() => newTaskRef.current?.focus(), 50);
  }

  function removeTask(id: string) {
    setTasks(t => t.length > 1 ? t.filter(x => x.id !== id) : t);
  }

  function updateTask(id: string, description: string) {
    setTasks(t => t.map(x => x.id === id ? { ...x, description } : x));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Nome obrigatório'); return; }
    if (!form.areaId) { toast.error('Seleciona uma área'); return; }
    if (!tasks.some(t => t.description.trim())) { toast.error('Adiciona pelo menos uma tarefa'); return; }
    saveMutation.mutate();
  }

  const areaMap = Object.fromEntries(areas.map(a => [a.id, a.name]));

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        <button
          onClick={() => { setTab('list'); setEditing(null); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${tab === 'list' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          <List size={16} /> Checklists ({templates.length})
        </button>
        <button
          onClick={openNew}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${tab === 'form' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          <Plus size={16} /> {editing ? 'Editar' : 'Nova Checklist'}
        </button>
      </div>

      {tab === 'list' && (
        <div className="p-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />)
          ) : !templates.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <ClipboardList size={40} className="mb-3 opacity-40" />
              <p className="text-sm">Nenhuma checklist criada</p>
              <button onClick={openNew} className="mt-4 text-sm text-blue-600 font-medium">
                Criar primeira checklist
              </button>
            </div>
          ) : templates.map(tpl => (
            <div key={tpl.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{tpl.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{areaMap[tpl.areaId] ?? '—'} · {tpl.tasks?.length ?? 0} tarefas</p>
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${FREQ_COLOR[tpl.frequency] ?? 'bg-gray-100 text-gray-600'}`}>
                    {FREQ_OPTS.find(f => f.value === tpl.frequency)?.label ?? tpl.frequency}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(tpl)} className="p-2 text-gray-400 active:text-blue-600">
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(tpl)}
                    disabled={deleteMutation.isPending}
                    className="p-2 text-gray-400 active:text-red-500"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'form' && (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {editing && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">A editar: <span className="font-semibold text-gray-900">{editing.name}</span></p>
              <button type="button" onClick={closeForm} className="p-1 text-gray-400"><X size={18} /></button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="ex: Limpeza Cozinha"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Área *</label>
            <select
              value={form.areaId}
              onChange={e => setForm(f => ({ ...f, areaId: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecionar área...</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Frequência *</p>
            <div className="flex gap-2">
              {FREQ_OPTS.map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setForm(fm => ({ ...fm, frequency: f.value }))}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${form.frequency === f.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Tarefas *</p>
              <button type="button" onClick={addTask} className="text-xs text-blue-600 font-medium flex items-center gap-1">
                <Plus size={13} /> Adicionar
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
              {tasks.map((task, idx) => (
                <div key={task.id} className="flex items-center gap-2 px-3 py-2">
                  <GripVertical size={14} className="text-gray-300 shrink-0" />
                  <span className="text-xs text-gray-400 w-5 shrink-0">{idx + 1}.</span>
                  <input
                    ref={idx === tasks.length - 1 ? newTaskRef : undefined}
                    value={task.description}
                    onChange={e => updateTask(task.id, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTask(); } }}
                    placeholder="Descrição da tarefa"
                    className="flex-1 text-sm text-gray-800 focus:outline-none bg-transparent"
                  />
                  {tasks.length > 1 && (
                    <button type="button" onClick={() => removeTask(task.id)} className="p-1 text-gray-300 active:text-red-500 shrink-0">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {editing && (
              <button type="button" onClick={closeForm} className="flex-1 py-3 rounded-xl font-semibold border border-gray-200 text-gray-600 active:bg-gray-50">
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex-1 py-3 rounded-xl font-semibold text-white bg-blue-600 active:bg-blue-700 disabled:opacity-50"
            >
              {saveMutation.isPending ? 'A guardar...' : editing ? 'Guardar' : 'Criar Checklist'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
