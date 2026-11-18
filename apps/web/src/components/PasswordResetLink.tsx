'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { KeyRound, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { useAuthStore } from '@/store/auth.store';
import { User } from '@/types';
import api from '@/lib/api';

export function PasswordResetLink({ user }: { user: User }) {
  const { user: me } = useAuthStore();
  const [open, setOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: () => api.post<{ link: string; expiresAt: string }>(`/users/${user.id}/password-reset`).then(r => r.data),
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao gerar link'),
  });

  if (!user.active || user.oauthAccounts?.some(account => account.provider === 'google') ||
    !(me?.role === 'SUPER_ADMIN' || (me?.role === 'CLIENT_ADMIN' && !!me.clientId && user.clientId === me.clientId && user.role === 'OPERATOR'))) return null;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(mutation.data!.link);
      toast.success('Link copiado!');
    } catch {
      toast.error('Não foi possível copiar. Selecione e copie o link.');
    }
  }

  function close() {
    if (mutation.isPending) return;
    setOpen(false);
    mutation.reset();
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="min-h-11 flex items-center gap-2 rounded-lg px-3 text-sm font-medium text-blue-600 hover:bg-blue-50 active:bg-blue-50"
        aria-label={`Recuperar password de ${user.name}`}>
        <KeyRound size={16} /> Recuperar password
      </button>
      <Modal open={open} onClose={close} title="Recuperar password" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-700 break-words">{user.name} · {user.email}</p>
          <p className="text-sm text-gray-500">
            Gere um link e partilhe-o com este utilizador por WhatsApp ou email para escolher uma nova password.
            O link é válido durante uma hora e só pode ser usado uma vez. Gerar outro link invalida o anterior.
          </p>
          {mutation.data ? (
            <>
              <label className="block text-xs font-medium text-gray-600">
                Link de recuperação
                <input readOnly value={mutation.data.link} onFocus={e => e.target.select()}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm font-mono" />
              </label>
              <p className="text-xs text-gray-500">Expira em {new Date(mutation.data.expiresAt).toLocaleString('pt-PT')}. A password atual mantém-se até à alteração.</p>
              <button type="button" onClick={copyLink}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white">
                <Copy size={16} /> Copiar link
              </button>
            </>
          ) : (
            <button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:opacity-50">
              {mutation.isPending ? 'A gerar...' : 'Gerar link de recuperação'}
            </button>
          )}
        </div>
      </Modal>
    </>
  );
}
