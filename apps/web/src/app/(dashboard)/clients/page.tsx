'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronRight, Building2, Plus, Pencil, UserPlus, Copy, Check, Trash2 } from 'lucide-react';
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
  name: string; nif?: string; email?: string;
  phone?: string; address?: string; sector?: string;
}

interface Invitation {
  id: string; email: string | null; createdAt: string; expiresAt: string;
}

const SECTORS = ['Hotel', 'Restaurante', 'Café', 'Clínica', 'Farmácia', 'Escritório', 'Indústria', 'Outro'];

export default function ClientsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [inviteClient, setInviteClient] = useState<Client | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') router.replace('/dashboard');
  }, [user, router]);

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then(r => r.data),
    enabled: user?.role === 'SUPER_ADMIN',
  });

  const { data: pendingInvites = [] } = useQuery<Invitation[]>({
    queryKey: ['invitations', inviteClient?.id],
    queryFn: () => api.get(`/invitations?clientId=${inviteClient!.id}`).then(r => r.data),
    enabled: !!inviteClient,
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ClientForm>();

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

  const createInviteMutation = useMutation({
    mutationFn: () => api.post('/invitations', {
      clientId: inviteClient!.id,
      email: inviteEmail || undefined,
    }).then(r => r.data),
    onSuccess: (data) => {
      setGeneratedLink(data.link);
      qc.invalidateQueries({ queryKey: ['invitations', inviteClient?.id] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao gerar convite'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}/permanent`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); toast.success('Cliente eliminado permanentemente'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao eliminar cliente'),
  });

  const revokeInviteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/invitations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invitations', inviteClient?.id] });
      toast.success('Convite revogado');
    },
  });

  function openNew() { setEditing(null); reset({}); setModalOpen(true); }

  function openEdit(c: Client) {
    setEditing(c);
    setValue('name', c.name); setValue('nif', c.nif ?? '');
    setValue('email', c.email ?? ''); setValue('phone', c.phone ?? '');
    setValue('address', c.address ?? ''); setValue('sector', c.sector ?? '');
    setModalOpen(true);
  }

  function closeModal() { setModalOpen(false); setEditing(null); reset({}); }

  function openInvite(c: Client) {
    setInviteClient(c);
    setInviteEmail('');
    setGeneratedLink(null);
    setCopied(false);
  }

  function closeInvite() {
    setInviteClient(null);
    setGeneratedLink(null);
    setInviteEmail('');
  }

  function copyLink() {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 3000);
  }

  if (user?.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">{clients.length} cliente(s) registado(s)</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="space-y-px">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse bg-gray-50" />)}
          </div>
        ) : !clients.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Building2 className="mb-3 h-10 w-10 opacity-40" />
            <p className="text-sm">Nenhum cliente registado</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={openNew}>Adicionar primeiro cliente</Button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {clients.map(client => (
              <li key={client.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                <Link href={`/clients/${client.id}`} className="flex flex-1 items-center gap-4 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {[client.sector, client.nif && `NIF ${client.nif}`, client.phone].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 ml-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${client.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {client.active ? 'Ativo' : 'Inativo'}
                  </span>
                  <button
                    onClick={(e) => { e.preventDefault(); openInvite(client); }}
                    className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    title="Convidar gestor"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                  <button onClick={(e) => { e.preventDefault(); openEdit(client); }} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); if (confirm(`Apagar permanentemente "${client.name}"? Esta ação elimina todos os dados associados e não pode ser desfeita.`)) deleteMutation.mutate(client.id); }}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Apagar permanentemente"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Modal criar/editar cliente */}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
            <select {...register('sector')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
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

      {/* Modal de convite */}
      <Modal open={!!inviteClient} onClose={closeInvite} title={`Convidar gestor — ${inviteClient?.name}`}>
        <div className="space-y-5">
          {!generatedLink ? (
            <>
              <p className="text-sm text-gray-500">
                Gere um link de convite para que o novo gestor possa criar a sua conta e aceder à plataforma.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email do gestor <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="gestor@empresa.pt"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Se preenchido, o email fica pré-preenchido no formulário de registo.</p>
              </div>

              {pendingInvites.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Convites pendentes</p>
                  <ul className="space-y-1">
                    {pendingInvites.map(inv => (
                      <li key={inv.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                        <span>{inv.email ?? 'Sem email'} · expira {new Date(inv.expiresAt).toLocaleDateString('pt-PT')}</span>
                        <button
                          onClick={() => revokeInviteMutation.mutate(inv.id)}
                          className="text-red-400 hover:text-red-600 ml-2"
                          title="Revogar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <Button type="button" variant="secondary" onClick={closeInvite}>Cancelar</Button>
                <Button
                  onClick={() => createInviteMutation.mutate()}
                  loading={createInviteMutation.isPending}
                  className="gap-2"
                >
                  <UserPlus size={15} /> Gerar convite
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                <p className="text-sm font-semibold text-green-800 mb-1">Convite criado com sucesso!</p>
                <p className="text-xs text-green-600">Válido durante 7 dias. Partilhe este link com o gestor.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Link de convite</label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={generatedLink}
                    className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 font-mono truncate"
                  />
                  <button
                    onClick={copyLink}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      copied ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="secondary" onClick={closeInvite}>Fechar</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
