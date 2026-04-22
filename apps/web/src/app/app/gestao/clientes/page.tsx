'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, List, Plus, Pencil, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Client } from '@/types';

const SECTORS = ['Hotel', 'Restaurante', 'Café', 'Clínica', 'Farmácia', 'Escritório', 'Indústria', 'Outro'];

const emptyForm = { name: '', nif: '', email: '', phone: '', address: '', sector: '' };

export default function ClientesMobilePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'list' | 'form'>('list');
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') router.replace('/app/gestao');
  }, [user, router]);

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then(r => r.data),
    enabled: user?.role === 'SUPER_ADMIN',
  });

  const saveMutation = useMutation({
    mutationFn: (data: typeof emptyForm) =>
      editing
        ? api.patch(`/clients/${editing.id}`, data).then(r => r.data)
        : api.post('/clients', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      toast.success(editing ? 'Cliente atualizado' : 'Cliente criado');
      closeForm();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao guardar'),
  });

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setTab('form');
  }

  function openEdit(c: Client) {
    setEditing(c);
    setForm({ name: c.name, nif: c.nif ?? '', email: c.email ?? '', phone: c.phone ?? '', address: c.address ?? '', sector: c.sector ?? '' });
    setTab('form');
  }

  function closeForm() {
    setTab('list');
    setEditing(null);
    setForm(emptyForm);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Nome obrigatório'); return; }
    saveMutation.mutate(form);
  }

  if (!user || user.role !== 'SUPER_ADMIN') return null;

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
          Clientes ({clients.length})
        </button>
        <button
          onClick={openNew}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
            tab === 'form' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
          }`}
        >
          <Plus size={16} />
          {editing ? 'Editar' : 'Novo Cliente'}
        </button>
      </div>

      {/* Lista */}
      {tab === 'list' && (
        <div className="p-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
            ))
          ) : !clients.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Building2 size={40} className="mb-3 opacity-40" />
              <p className="text-sm">Nenhum cliente registado</p>
              <button onClick={openNew} className="mt-4 text-sm text-blue-600 font-medium">
                Adicionar primeiro cliente
              </button>
            </div>
          ) : (
            clients.map(c => (
              <div key={c.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <Building2 size={18} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {[c.sector, c.nif && `NIF ${c.nif}`, c.phone].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.active ? 'Ativo' : 'Inativo'}
                    </span>
                    <button onClick={() => openEdit(c)} className="p-2 text-gray-400 active:text-blue-600">
                      <Pencil size={16} />
                    </button>
                  </div>
                </div>
                {c.address && <p className="text-xs text-gray-400 mt-2 ml-13">{c.address}</p>}
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
              placeholder="Nome da empresa"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">NIF</label>
              <input
                value={form.nif}
                onChange={e => setForm(f => ({ ...f, nif: e.target.value }))}
                placeholder="123456789"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Telefone</label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+351 900 000 000"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="geral@empresa.pt"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Morada</label>
            <input
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="Rua, Localidade"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Setor</label>
            <select
              value={form.sector}
              onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Selecionar setor...</option>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

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
              {saveMutation.isPending ? 'A guardar...' : editing ? 'Guardar' : 'Criar Cliente'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
