'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

const TIPOS = [
  { emoji: '📦', code: 'R1', title: 'Entradas', subtitle: 'Controlo de produtos à receção', href: '/app/registos/entradas', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-l-blue-600' },
  { emoji: '🌡️', code: 'R2', title: 'Temperaturas', subtitle: 'Controlo de arcas e frigoríficos', href: '/app/registos/temperaturas', color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-l-sky-600' },
  { emoji: '🧹', code: 'R3', title: 'Higienização', subtitle: 'Registo de limpeza por zona', href: '/app/registos/higienizacao', color: 'text-green-700', bg: 'bg-green-50', border: 'border-l-green-600' },
  { emoji: '🧪', code: 'R4', title: 'Desinfeção', subtitle: 'Produtos destinados a consumir crus', href: '/app/registos/desinfecao', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-l-purple-600' },
  { emoji: '🍳', code: 'R6', title: 'Óleos de Fritura', subtitle: 'Controlo de compostos polares', href: '/app/registos/oleos', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-l-amber-600' },
];

export default function RegistosPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="bg-blue-900 rounded-xl p-4 text-white">
        <p className="font-bold text-base">Registos HACCP</p>
        <p className="text-sm text-blue-200 mt-1">Seleciona o tipo de registo a efetuar</p>
      </div>

      <div className="space-y-3">
        {TIPOS.map(t => (
          <Link
            key={t.code}
            href={t.href}
            className={`flex items-center ${t.bg} rounded-xl p-4 border-l-4 ${t.border} shadow-sm active:opacity-70`}
          >
            <span className="text-3xl mr-4">{t.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold opacity-60 ${t.color}`}>{t.code}</span>
                <span className={`font-semibold ${t.color}`}>{t.title}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{t.subtitle}</p>
            </div>
            <ChevronRight size={18} className="text-gray-400 ml-2 shrink-0" />
          </Link>
        ))}
      </div>

      <p className="text-xs text-center text-gray-400 pt-2">
        📌 Todos os registos ficam associados ao teu utilizador e à data/hora atual.
      </p>
    </div>
  );
}
