'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, List, Plus, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Area, Client } from '@/types';

const emptyForm = { name: '', description: '', floor: '', clientId: '' };

export default function AreasMobilePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'list' | 'form'>('list');
  const [editing, setEditing] = useState<Area | null>(null);
  const [form, setForm] = useState({ ...emptyForm, clientId: user?.clientId ?? '' });

  const { data: areas = [], isLoading } = useQuery<Area[]>({
    queryKey: ['areas', user?.clientId],
    queryFn: () => api.get('/areas').then(r => r.data),
    enabled: !!user,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then(r => r.data),
    enabled: user?.role === 'SUPER_ADMIN',
  });

  const saveMutation = useMutation({
    mutationFn: (data: typeof emptyForm) =>
      editing
        ? api.patch(`/areas/${editing.id}`, data).then(r => r.data)
        : api.post('/areas', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['areas'] });
      toast.success(editing ? 'Área atualizada' : 'Área criada');
      closeForm();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao guardar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/areas/${id}/delete`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['areas'] });
      toast.success('Área eliminada');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao eliminar'),
  });

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, clientId: user?.clientId ?? '' });
    setTab('form');
  }

  function openEdit(a: Area) {
    setEditing(a);
    setForm({ name: a.name, description: a.description ?? '', floor: a.floor ?? '', clientId: a.clientId });
    setTab('form');
  }

  function closeForm() {
    setTab('list');
    setEditing(null);
    setForm({ ...emptyForm, clientId: user?.clientId ?? '' });
  }

  function handleDelete(a: Area) {
    if (window.confirm(`Eliminar a área "${a.name}"?`)) {
      deleteMutation.mutate(a.id);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Nome obrigatório'); return; }
    if (user?.role === 'SUPER_ADMIN' && !form.clientId) { toast.error('Selecione um cliente'); return; }
    saveMutation.mutate(form);
  }

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]));

  return (
    <div className="flex flex-col min-h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        <button
          onClick={() => { setTab('list'); setEditing(null); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
            tab === 'list' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
          }`}
        >
          <List size={16} />
          Áreas ({areas.length})
        </button>
        <button
          onClick={openNew}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
            tab === 'form' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
          }`}
        >
          <Plus size={16} />
          {editing ? 'Editar' : 'Nova Área'}
        </button>
      </div>

      {/* Lista */}
      {tab === 'list' && (
        <div className="p-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
            ))
          ) : !areas.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <MapPin size={40} className="mb-3 opacity-40" />
              <p className="text-sm">Nenhuma área registada</p>
              <button onClick={openNew} className="mt-4 text-sm text-blue-600 font-medium">
                Adicionar primeira área
              </button>
            </div>
          ) : (
            areas.map(a => (
              <div key={a.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                      <MapPin size={18} className="text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{a.name}</p>
                      <p className="text-xs text-gray-500">
                        {[
                          a.floor && `Piso ${a.floor}`,
                          user?.role === 'SUPER_ADMIN' && clientMap[a.clientId],
                        ].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {a.active ? 'Ativa' : 'Inativa'}
                    </span>
                    <button onClick={() => openEdit(a)} className="p-2 text-gray-400 active:text-blue-600">
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(a)}
                      disabled={deleteMutation.isPending}
                      className="p-2 text-gray-400 active:text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {a.description && <p className="text-xs text-gray-400 mt-2">{a.description}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {/* Formulário */}
      {tab === 'form' && (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {editing && (
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-600">A editar: <span className="text-gray-900">{editing.name}</span></p>
              <button type="button" onClick={closeForm} className="p-1 text-gray-400">
                <X size={18} />
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Nome *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="ex: Cozinha, WC Piso 1"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Piso</label>
              <input
                value={form.floor}
                onChange={e => setForm(f => ({ ...f, floor: e.target.value }))}
                placeholder="ex: 0, 1, Cave"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Descrição</label>
            <input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descrição opcional"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {user?.role === 'SUPER_ADMIN' && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Cliente *</label>
              <select
                value={form.clientId}
                onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Selecionar cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {editing && (
              <button
                type="button"
                onClick={closeForm}
                className="flex-1 py-3 rounded-xl font-semibold border border-gray-200 text-gray-600 active:bg-gray-50"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex-1 py-3 rounded-xl font-semibold text-white bg-blue-600 active:bg-blue-700 disabled:opacity-50"
            >
              {saveMutation.isPending ? 'A guardar...' : editing ? 'Guardar' : 'Criar Área'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
