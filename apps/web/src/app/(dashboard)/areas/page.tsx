'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { Area, Client } from '@/types';

interface AreaForm {
  name: string;
  description?: string;
  floor?: string;
  clientId: string;
}

export default function AreasPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Area | null>(null);

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

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<AreaForm>({
    defaultValues: { clientId: user?.clientId ?? '' },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/areas/${id}/delete`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['areas'] });
      toast.success('Área eliminada');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao eliminar'),
  });

  function confirmDelete(a: Area) {
    if (window.confirm(`Eliminar a área "${a.name}"? Esta ação não pode ser desfeita.`)) {
      deleteMutation.mutate(a.id);
    }
  }

  const saveMutation = useMutation({
    mutationFn: (data: AreaForm) =>
      editing
        ? api.patch(`/areas/${editing.id}`, data).then(r => r.data)
        : api.post('/areas', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['areas'] });
      toast.success(editing ? 'Área atualizada' : 'Área criada');
      closeModal();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao guardar'),
  });

  function openNew() {
    setEditing(null);
    reset({ clientId: user?.clientId ?? '' });
    setModalOpen(true);
  }

  function openEdit(a: Area) {
    setEditing(a);
    setValue('name', a.name);
    setValue('description', a.description ?? '');
    setValue('floor', a.floor ?? '');
    setValue('clientId', a.clientId);
    setModalOpen(true);
  }

  function closeModal() { setModalOpen(false); setEditing(null); reset({ clientId: user?.clientId ?? '' }); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Áreas</h1>
          <p className="text-sm text-gray-500">{areas.length} área(s) registada(s)</p>
        </div>
        {user?.role !== 'OPERATOR' && (
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Área
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Card key={i}><div className="h-20 animate-pulse rounded-md bg-gray-100" /></Card>)}
        </div>
      ) : !areas.length ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <MapPin className="mb-3 h-10 w-10 opacity-40" />
            <p className="text-sm">Nenhuma área registada</p>
            {user?.role !== 'OPERATOR' && (
              <Button variant="secondary" size="sm" className="mt-4" onClick={openNew}>Adicionar primeira área</Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map(area => (
            <Card key={area.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{area.name}</p>
                    {area.floor && <p className="text-xs text-gray-400">Piso {area.floor}</p>}
                    {area.description && <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{area.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${area.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {area.active ? 'Ativa' : 'Inativa'}
                  </span>
                  {user?.role !== 'OPERATOR' && (
                    <>
                      <button onClick={() => openEdit(area)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 ml-1">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => confirmDelete(area)}
                        disabled={deleteMutation.isPending}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 ml-0.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Editar Área' : 'Nova Área'}>
        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-4">
          <Input label="Nome *" placeholder="ex: Cozinha, WC Piso 1" error={errors.name?.message}
            {...register('name', { required: 'Nome obrigatório' })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Piso" placeholder="ex: 0, 1, Cave" {...register('floor')} />
            <div />
          </div>
          <Input label="Descrição" placeholder="Descrição opcional da área" {...register('description')} />
          {user?.role === 'SUPER_ADMIN' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
              <select {...register('clientId', { required: 'Selecione um cliente' })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selecionar cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.clientId && <p className="text-xs text-red-500 mt-1">{errors.clientId.message}</p>}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" loading={saveMutation.isPending}>{editing ? 'Guardar' : 'Criar Área'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
