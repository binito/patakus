'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, Upload } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { Product } from '@/types';

export default function ProductsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; updated: number; skipped: number } | null>(null);

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then((r) => r.data),
    enabled: user?.role === 'SUPER_ADMIN',
  });

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setImporting(true);
    setImportResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/products/import-csv', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch {
      setImportResult(null);
      alert('Erro ao importar CSV. Verifica o formato do ficheiro.');
    } finally {
      setImporting(false);
    }
  }

  if (user?.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500">Catálogo de produtos do sistema</p>
        </div>
        <div className="flex items-center gap-3">
          {importResult && (
            <span className="text-sm text-gray-500">
              <span className="font-medium text-green-600">{importResult.created} criados</span>
              {' · '}
              <span className="font-medium text-blue-600">{importResult.updated} atualizados</span>
              {' · '}
              <span className="text-gray-400">{importResult.skipped} ignorados</span>
            </span>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCsvUpload}
          />
          <Button
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="h-4 w-4" />
            {importing ? 'A importar...' : 'Importar CSV'}
          </Button>
        </div>
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-md bg-gray-100" />
            ))}
          </div>
        ) : !products?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Box className="mb-3 h-10 w-10 opacity-40" />
            <p className="text-sm">Nenhum produto cadastrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500">
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-6 py-3">Categoria</th>
                  <th className="px-6 py-3">Marca</th>
                  <th className="px-6 py-3">Preço</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                          <Box className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{product.name}</span>
                          {product.sku && <p className="text-xs text-gray-400">{product.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{product.category ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-500">{product.description ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {product.price != null ? `€${product.price.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={product.active ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
