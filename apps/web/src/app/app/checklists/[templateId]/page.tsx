'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { ChecklistTemplate } from '@/types';

export default function ExecuteChecklistPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');

  const { data: template, isLoading } = useQuery<ChecklistTemplate>({
    queryKey: ['checklist-template', templateId],
    queryFn: () => api.get(`/checklists/templates/${templateId}`).then(r => r.data),
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () =>
      api.post('/checklists/submit', {
        templateId,
        areaId: template?.areaId,
        notes: notes || undefined,
        taskResults: tasks.map(t => ({
          taskId: t.id,
          done: !!checked[t.id],
        })),
      }),
    onSuccess: () => {
      toast.success('Checklist submetida!');
      router.back();
    },
    onError: () => toast.error('Erro ao submeter checklist'),
  });

  const tasks = template?.tasks ?? [];
  const allChecked = tasks.length > 0 && tasks.every(t => checked[t.id]);
  const checkedCount = Object.values(checked).filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <div className="h-8 bg-gray-100 rounded animate-pulse w-3/4" />
        {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      <div className="p-4 space-y-4 flex-1">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-blue-600 text-sm">
          <ArrowLeft size={16} /> Voltar
        </button>

        <div>
          <h1 className="text-lg font-bold text-gray-800">{template?.name}</h1>
          <p className="text-sm text-gray-400">{checkedCount}/{tasks.length} tarefas concluídas</p>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: tasks.length ? `${(checkedCount / tasks.length) * 100}%` : '0%' }}
          />
        </div>

        <div className="space-y-2">
          {tasks.map(task => (
            <button
              key={task.id}
              onClick={() => setChecked(prev => ({ ...prev, [task.id]: !prev[task.id] }))}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-colors ${
                checked[task.id]
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-100'
              }`}
            >
              {checked[task.id]
                ? <CheckCircle2 size={22} className="text-green-500 shrink-0" />
                : <Circle size={22} className="text-gray-300 shrink-0" />}
              <span className={`text-sm ${checked[task.id] ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {task.description}
              </span>
            </button>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Notas (opcional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Observações adicionais..."
            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <button
          onClick={() => submit()}
          disabled={isPending || tasks.length === 0}
          className={`w-full py-3 rounded-xl font-semibold text-white transition-colors ${
            allChecked
              ? 'bg-green-500 active:bg-green-600'
              : 'bg-blue-600 active:bg-blue-700'
          } disabled:opacity-50`}
        >
          {isPending ? 'A submeter...' : allChecked ? 'Concluir Checklist' : `Submeter (${checkedCount}/${tasks.length})`}
        </button>
      </div>
    </div>
  );
}
