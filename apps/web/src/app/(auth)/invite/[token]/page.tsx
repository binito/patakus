'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

interface InviteInfo {
  email: string | null;
  role: string;
  clientName: string;
  expiresAt: string;
}

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/(?=.*[A-Za-z])(?=.*\d)/, 'Deve conter letras e números'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'As passwords não coincidem',
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof schema>;

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { login } = useAuthStore();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [oauthLoading, setOauthLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauth = params.get('oauth');
    const oauthError = params.get('oauth_error');

    if (oauthError) {
      const messages: Record<string, string> = {
        state: 'A sessão Google expirou. Tente novamente',
        callback: 'Não foi possível criar a conta com Google',
      };
      toast.error(messages[oauthError] || 'Não foi possível criar a conta com Google');
      window.history.replaceState({}, '', `/invite/${token}`);
    }

    if (oauth === 'success') {
      setOauthLoading(true);
      api.post<{ access_token: string; user: import('@/types').User }>('/auth/refresh')
        .then(({ data }) => {
          login(data.user, data.access_token);
          toast.success(`Bem-vindo, ${data.user.name}!`);
          router.replace('/dashboard');
        })
        .catch(() => {
          toast.error('Não foi possível concluir o login com Google');
          window.history.replaceState({}, '', `/invite/${token}`);
          setLoading(false);
        })
        .finally(() => setOauthLoading(false));
      return;
    }

    api.get(`/invitations/${token}/validate`)
      .then(r => {
        setInfo(r.data);
        if (r.data.email) setValue('email', r.data.email);
      })
      .catch(e => setError(e?.response?.data?.message ?? 'Convite inválido'))
      .finally(() => setLoading(false));
  }, [token, setValue, login, router]);

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await api.post<{ access_token: string; user: import('@/types').User }>(`/invitations/${token}/accept`, {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      login(res.data.user, res.data.access_token);
      toast.success(`Bem-vindo, ${res.data.user.name}!`);
      router.replace('/dashboard');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro ao criar conta');
    }
  };

  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
  const googleOAuthUrl = `${apiBaseUrl}/auth/oauth/google?inviteToken=${encodeURIComponent(token)}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600">Patakus</h1>
          <p className="mt-1 text-sm text-gray-500">Gestão HACCP inteligente</p>
        </div>

        {(loading || oauthLoading) && (
          <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
            <Loader2 size={32} className="animate-spin text-blue-500" />
            <p className="text-sm">{oauthLoading ? 'A concluir login com Google...' : 'A validar convite...'}</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <AlertTriangle size={40} className="mx-auto mb-3 text-red-400" />
            <p className="font-semibold text-red-700">{error}</p>
            <p className="mt-1 text-sm text-red-500">Este link pode ter expirado ou já sido utilizado.</p>
          </div>
        )}

        {info && !error && (
          <div className="space-y-6">
            {/* Banner do cliente */}
            <div className="rounded-2xl bg-blue-700 px-6 py-5 text-white text-center">
              <ShieldCheck size={32} className="mx-auto mb-2 text-blue-200" />
              <p className="text-sm text-blue-200 mb-1">Foi convidado para gerir</p>
              <p className="text-xl font-bold">{info.clientName}</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Criar a sua conta</h2>
              <p className="text-sm text-gray-500 mb-6">Defina as suas credenciais de acesso.</p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Nome completo *"
                  placeholder="O seu nome"
                  error={errors.name?.message}
                  {...register('name')}
                />
                <Input
                  label="E-mail *"
                  type="email"
                  placeholder="seu@email.com"
                  readOnly={!!info.email}
                  className={info.email ? 'bg-gray-50 text-gray-500' : ''}
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Input
                  label="Password *"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <Input
                  label="Confirmar password *"
                  type="password"
                  placeholder="Repetir password"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />

                <Button type="submit" className="w-full mt-2" size="lg" loading={isSubmitting}>
                  Criar conta e entrar
                </Button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-semibold uppercase text-gray-400">ou</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <a
                href={googleOAuthUrl}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z" />
                </svg>
                Criar conta com Google
              </a>
            </div>

            <p className="text-center text-xs text-gray-400">
              Convite válido até {new Date(info.expiresAt).toLocaleDateString('pt-PT')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
