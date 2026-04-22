'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, MapPin, UserCircle, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export default function GestaoPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role === 'OPERATOR') router.replace('/app');
  }, [user, router]);

  if (!user || user.role === 'OPERATOR') return null;

  const sections = [
    ...(user.role === 'SUPER_ADMIN' ? [{
      href: '/app/gestao/clientes',
      icon: Building2,
      label: 'Clientes',
      description: 'Gerir clientes e contratos',
      color: 'bg-blue-100 text-blue-600',
    }] : []),
    {
      href: '/app/gestao/areas',
      icon: MapPin,
      label: 'Áreas',
      description: 'Gerir áreas e zonas',
      color: 'bg-green-100 text-green-600',
    },
    {
      href: '/app/gestao/utilizadores',
      icon: UserCircle,
      label: 'Utilizadores',
      description: 'Gerir utilizadores e permissões',
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <div className="p-4 space-y-3">
      <div className="mb-5">
        <h1 className="text-lg font-bold text-gray-900">Gestão</h1>
        <p className="text-sm text-gray-500">Administração do sistema</p>
      </div>

      {sections.map(({ href, icon: Icon, label, description, color }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:bg-gray-50"
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            <Icon size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">{label}</p>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
          <ChevronRight size={18} className="text-gray-300 shrink-0" />
        </Link>
      ))}
    </div>
  );
}
