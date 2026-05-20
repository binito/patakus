'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, ExternalLink, Search, Box } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';
import { Product } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function FichasTecnicasPage() {
  const [search, setSearch] = useState('');

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then((r) => r.data),
  });

  const fichas = (products ?? []).filter(
    (p) =>
      p.technicalSheetUrl &&
      (search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.category ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (p.sku ?? '').toLowerCase().includes(search.toLowerCase())),
  );

  const byCategory = fichas.reduce<Record<string, Product[]>>((acc, p) => {
    const cat = p.category ?? 'Outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const categories = Object.keys(byCategory).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fichas Técnicas</h1>
          <p className="text-sm text-gray-500">Documentação técnica dos produtos</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : fichas.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText className="mb-3 h-10 w-10 opacity-40" />
            <p className="text-sm">
              {search ? 'Nenhuma ficha técnica encontrada' : 'Ainda não existem fichas técnicas disponíveis'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {byCategory[category].map((product) => (
                  <a
                    key={product.id}
                    href={`${API_BASE}${product.technicalSheetUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{product.name}</p>
                      {product.sku && <p className="text-xs text-gray-400 mt-0.5">{product.sku}</p>}
                      <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                        <span className="truncate">{product.technicalSheetName ?? 'Ver PDF'}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        {fichas.length > 0 && `${fichas.length} ficha${fichas.length !== 1 ? 's' : ''} disponíve${fichas.length !== 1 ? 'is' : 'l'}`}
      </p>
    </div>
  );
}
