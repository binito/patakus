'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronRight, Building2, Plus, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { Client } from '@/types';

interface ClientForm {
  name: string;
  nif?: string;
  email?: string;
  phone?: string;
  address?: string;
  sector?: string;
}

const SECTORS = ['Hotel', 'Restaurante', 'Café', 'Clínica', 'Farmácia', 'Escritório', 'Indústria', 'Outro'];

export default function ClientsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') router.replace('/dashboard');
  }, [user, router]);

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then(r => r.data),
    enabled: user?.role === 'SUPER_ADMIN',
  });

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<ClientForm>();

  const saveMutation = useMutation({
    mutationFn: (data: ClientForm) =>
      editing
        ? api.patch(`/clients/${editing.id}`, data).then(r => r.data)
        : api.post('/clients', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      toast.success(editing ? 'Cliente atualizado' : 'Cliente criado');
      closeModal();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao guardar'),
  });

  function openNew() { setEditing(null); reset({}); setModalOpen(true); }

  function openEdit(c: Client) {
    setEditing(c);
    setValue('name', c.name);
    setValue('nif', c.nif ?? '');
    setValue('email', c.email ?? '');
    setValue('phone', c.phone ?? '');
    setValue('address', c.address ?? '');
    setValue('sector', c.sector ?? '');
    setModalOpen(true);
  }

  function closeModal() { setModalOpen(false); setEditing(null); reset({}); }

  if (user?.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Clientes</h1>
          <p className="text-sm text-gray-500">{clients.length} cliente(s) registado(s)</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="space-y-px">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse bg-surface-1" />)}
          </div>
        ) : !clients.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Building2 className="mb-3 h-10 w-10 opacity-40" />
            <p className="text-sm">Nenhum cliente registado</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={openNew}>Adicionar primeiro cliente</Button>
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {clients.map(client => (
              <li key={client.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-1">
                <Link href={`/clients/${client.id}`} className="flex flex-1 items-center gap-4 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-100">{client.name}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {[client.sector, client.nif && `NIF ${client.nif}`, client.phone].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 ml-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${client.active ? 'bg-green-500/15 text-green-400' : 'bg-surface-3 text-gray-500'}`}>
                    {client.active ? 'Ativo' : 'Inativo'}
                  </span>
                  <button onClick={(e) => { e.preventDefault(); openEdit(client); }} className="rounded p-1.5 text-gray-400 hover:bg-surface-3 hover:text-gray-400">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Editar Cliente' : 'Novo Cliente'}>
        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-4">
          <Input label="Nome *" placeholder="Nome da empresa" error={errors.name?.message}
            {...register('name', { required: 'Nome obrigatório' })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="NIF" placeholder="123456789" {...register('nif')} />
            <Input label="Telefone" placeholder="+351 900 000 000" {...register('phone')} />
          </div>
          <Input label="Email" type="email" placeholder="geral@empresa.pt" {...register('email')} />
          <Input label="Morada" placeholder="Rua, Localidade" {...register('address')} />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Setor</label>
            <select {...register('sector')}
              className="w-full rounded-md border border-border bg-surface-2 text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Selecionar setor</option>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" loading={saveMutation.isPending}>{editing ? 'Guardar' : 'Criar Cliente'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
