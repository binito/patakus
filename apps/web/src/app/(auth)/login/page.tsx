'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import {
  ClipboardCheck, Thermometer, AlertTriangle,
  Package, FileText, ShieldCheck,
} from 'lucide-react';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

type FormValues = z.infer<typeof schema>;

const features = [
  {
    icon: ClipboardCheck,
    color: 'bg-blue-500',
    title: 'Checklists de Limpeza',
    desc: 'Registe e acompanhe as tarefas de higienização por área em tempo real.',
  },
  {
    icon: Thermometer,
    color: 'bg-orange-500',
    title: 'Controlo de Temperaturas',
    desc: 'Monitorize equipamentos de frio com alertas automáticos de desvio.',
  },
  {
    icon: AlertTriangle,
    color: 'bg-red-500',
    title: 'Gestão de Anomalias',
    desc: 'Reporte não conformidades com fotos e acompanhe a resolução.',
  },
  {
    icon: Package,
    color: 'bg-emerald-500',
    title: 'Consumíveis & Stock',
    desc: 'Controle faltas de stock e receba alertas quando os mínimos são atingidos.',
  },
  {
    icon: FileText,
    color: 'bg-purple-500',
    title: 'Registos HACCP',
    desc: 'Entradas, higienização, desinfeção e óleos de fritura num só lugar.',
  },
  {
    icon: ShieldCheck,
    color: 'bg-teal-500',
    title: 'Conformidade Garantida',
    desc: 'Relatórios prontos para auditorias e inspeções sanitárias.',
  },
];

// Duplicamos para criar loop contínuo
const scrollItems = [...features, ...features];

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, hydrated } = useAuthStore();
  const [oauthLoading, setOauthLoading] = useState(false);

  const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace(isMobile() ? '/app' : '/dashboard');
    }
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauth = params.get('oauth');
    const oauthError = params.get('oauth_error');

    if (oauthError) {
      const messages: Record<string, string> = {
        config: 'OAuth Google não está configurado no servidor',
        state: 'A sessão OAuth expirou. Tente novamente',
        callback: 'Não foi possível concluir o login com Google',
      };
      toast.error(messages[oauthError] || 'Não foi possível concluir o login com Google');
      window.history.replaceState({}, '', '/login');
      return;
    }

    if (oauth !== 'success') return;

    setOauthLoading(true);
    api.post<{ access_token: string; user: import('@/types').User }>('/auth/refresh')
      .then(({ data }) => {
        login(data.user, data.access_token);
        toast.success('Login com Google realizado com sucesso!');
        router.replace(isMobile() ? '/app' : '/dashboard');
      })
      .catch(() => {
        toast.error('Não foi possível concluir o login com Google');
        window.history.replaceState({}, '', '/login');
      })
      .finally(() => setOauthLoading(false));
  }, [login, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await api.post<{ access_token: string; user: import('@/types').User }>('/auth/login', data);
      login(res.data.user, res.data.access_token);
      toast.success('Login realizado com sucesso!');
      router.replace(isMobile() ? '/app' : '/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'E-mail ou senha inválidos';
      toast.error(message);
    }
  };

  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
  const googleOAuthUrl = `${apiBaseUrl}/auth/oauth/google`;

  return (
    <div className="flex min-h-screen">
      {/* ── Coluna esquerda — animação (só desktop) ── */}
      <div className="hidden lg:flex flex-col flex-1 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 relative overflow-hidden">
        {/* Padrão de fundo subtil */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          {/* Logo */}
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Patakus</h1>
            <p className="text-blue-200 text-sm mt-1">Gestão HACCP inteligente</p>
          </div>

          {/* Título central */}
          <div className="mt-16 mb-8">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Tudo o que precisa<br />
              <span className="text-blue-200">numa só plataforma.</span>
            </h2>
            <p className="mt-4 text-blue-100 text-base leading-relaxed max-w-sm">
              Automatize a conformidade HACCP, reduza o papel e mantenha o controlo total da higiene e segurança alimentar.
            </p>
          </div>

          {/* Cards animados */}
          <div className="flex-1 overflow-hidden relative">
            {/* Gradiente superior */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-blue-700 to-transparent z-10 pointer-events-none" />
            {/* Gradiente inferior */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-indigo-700 to-transparent z-10 pointer-events-none" />

            <div className="animate-scroll-up space-y-4 pr-2">
              {scrollItems.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={i}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 flex items-start gap-4"
                  >
                    <div className={`${f.color} rounded-xl p-2.5 shrink-0`}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{f.title}</p>
                      <p className="text-blue-100 text-xs mt-1 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Coluna direita — formulário ── */}
      <div className="flex flex-1 flex-col items-center justify-start bg-gray-50 px-6 pt-12 pb-8 lg:max-w-md lg:w-full">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="mb-8 text-center lg:hidden">
            <h1 className="text-3xl font-bold text-blue-600">Patakus</h1>
            <p className="mt-1 text-gray-500 text-sm">Gestão HACCP inteligente</p>
          </div>

          {/* Título desktop */}
          <div className="mb-8 hidden lg:block">
            <h2 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h2>
            <p className="mt-1 text-gray-500 text-sm">Entre com as suas credenciais</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Senha"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password')}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={isSubmitting || oauthLoading}
              >
                Entrar
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
              Entrar ou criar conta com Google
            </a>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} Patakus · Todos os direitos reservados
            {' · '}
            <a href="/privacidade" className="underline hover:text-gray-600">Política de Privacidade</a>
          </p>
        </div>
      </div>
    </div>
  );
}
