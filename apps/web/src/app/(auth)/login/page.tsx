'use client';

import { useEffect } from 'react';
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

  const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace(isMobile() ? '/app' : '/dashboard');
    }
  }, [hydrated, isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await api.post<{ user: import('@/types').User }>('/auth/login', data);
      login(res.data.user);
      toast.success('Login realizado com sucesso!');
      router.replace(isMobile() ? '/app' : '/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'E-mail ou senha inválidos';
      toast.error(message);
    }
  };

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
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-6 py-12 lg:max-w-md lg:w-full">
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
                loading={isSubmitting}
              >
                Entrar
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} Patakus · Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
