'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { KeyRound } from 'lucide-react';

// O fragmento do link não é enviado ao servidor, aos logs ou no Referer.
const publicApi = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001' });
function errorMessage(error: any) {
  const message = error?.response?.data?.message;
  return Array.isArray(message) ? message.join('. ') : message || 'Não foi possível concluir. Tente novamente.';
}

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'invalid' | 'done'>('loading');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const value = window.location.hash.slice(1);
    setToken(value);
    if (!/^[a-f0-9]{64}$/.test(value)) { setStatus('invalid'); return; }
    let cancelled = false;
    publicApi.post('/password-resets/validate', { token: value }).then(() => {
      if (!cancelled) setStatus('ready');
    }).catch(error => {
      if (!cancelled) {
        setError(errorMessage(error));
        setStatus('invalid');
      }
    });
    return () => { cancelled = true; };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (password !== confirmation) { setError('As passwords não coincidem'); return; }
    if (new TextEncoder().encode(password).length > 72) { setError('A password é demasiado longa'); return; }
    setSaving(true);
    setError('');
    try {
      await publicApi.post('/password-resets/complete', { token, password });
      setStatus('done');
      setPassword('');
      setConfirmation('');
      setToken('');
      window.history.replaceState(null, '', window.location.pathname);
    } catch (error) {
      setError(errorMessage(error));
    } finally { setSaving(false); }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm space-y-5">
        <KeyRound className="h-8 w-8 text-blue-600" />
        <h1 className="text-xl font-bold text-gray-900">Nova password</h1>
        {status === 'loading' && <p className="text-sm text-gray-500">A verificar o link...</p>}
        {status === 'invalid' && <p role="alert" className="text-sm text-red-600">{error || 'Link inválido ou expirado. Peça um novo link ao administrador.'}</p>}
        {status === 'done' && <p role="status" className="text-sm text-green-700">Password alterada com sucesso. Já pode entrar com a nova password.</p>}
        {status === 'ready' && (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-gray-500">Use pelo menos 8 caracteres, com maiúscula, minúscula, número e símbolo (!@#$%…).</p>
            <label className="block text-sm font-medium text-gray-700">
              Nova password
              <input type="password" autoComplete="new-password" required minLength={8} maxLength={72}
                value={password} onChange={e => setPassword(e.target.value)} disabled={saving}
                className="mt-1 w-full rounded-xl border border-gray-300 p-3" />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Confirmar password
              <input type="password" autoComplete="new-password" required minLength={8} maxLength={72}
                value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={saving}
                className="mt-1 w-full rounded-xl border border-gray-300 p-3" />
            </label>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={saving} className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:opacity-50">
              {saving ? 'A guardar...' : 'Guardar nova password'}
            </button>
          </form>
        )}
        <Link href="/login" className="block text-center text-sm font-medium text-blue-600">Voltar ao login</Link>
      </div>
    </main>
  );
}
