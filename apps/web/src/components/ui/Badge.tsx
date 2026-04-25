import { clsx } from 'clsx';

type BadgeStatus =
  | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'PENDING' | 'APPROVED'
  | 'REJECTED' | 'DELIVERED' | 'COMPLETED' | 'DRAFT' | 'CONFIRMED'
  | 'CANCELLED' | 'ORDERED' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  | 'ACTIVE' | 'INACTIVE';

const statusConfig: Record<BadgeStatus, { label: string; dot: string; text: string }> = {
  OPEN:        { label: 'Aberto',       dot: 'bg-red-400',     text: 'text-red-400' },
  IN_PROGRESS: { label: 'Em Andamento', dot: 'bg-yellow-400',  text: 'text-yellow-400' },
  RESOLVED:    { label: 'Resolvido',    dot: 'bg-green-400',   text: 'text-green-400' },
  PENDING:     { label: 'Pendente',     dot: 'bg-yellow-400',  text: 'text-yellow-400' },
  APPROVED:    { label: 'Aprovado',     dot: 'bg-green-400',   text: 'text-green-400' },
  REJECTED:    { label: 'Rejeitado',    dot: 'bg-red-400',     text: 'text-red-400' },
  DELIVERED:   { label: 'Entregue',     dot: 'bg-primary-400', text: 'text-primary-400' },
  COMPLETED:   { label: 'Concluído',    dot: 'bg-green-400',   text: 'text-green-400' },
  LOW:         { label: 'Baixa',        dot: 'bg-gray-500',    text: 'text-gray-500' },
  MEDIUM:      { label: 'Média',        dot: 'bg-yellow-400',  text: 'text-yellow-400' },
  HIGH:        { label: 'Alta',         dot: 'bg-orange-400',  text: 'text-orange-400' },
  CRITICAL:    { label: 'Crítica',      dot: 'bg-red-400 animate-pulse', text: 'text-red-300 font-semibold' },
  DRAFT:       { label: 'Rascunho',     dot: 'bg-gray-600',    text: 'text-gray-600' },
  CONFIRMED:   { label: 'Confirmado',   dot: 'bg-primary-400', text: 'text-primary-400' },
  CANCELLED:   { label: 'Cancelado',    dot: 'bg-red-400',     text: 'text-red-400' },
  ORDERED:     { label: 'Encomendado',  dot: 'bg-primary-400', text: 'text-primary-400' },
  ACTIVE:      { label: 'Ativo',        dot: 'bg-green-400 animate-pulse', text: 'text-green-400' },
  INACTIVE:    { label: 'Inativo',      dot: 'bg-gray-600',    text: 'text-gray-600' },
};

interface BadgeProps {
  status: BadgeStatus;
  className?: string;
}

export function Badge({ status, className }: BadgeProps) {
  const cfg = statusConfig[status] ?? { label: status, dot: 'bg-gray-500', text: 'text-gray-500' };
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-xs font-medium', cfg.text, className)}>
      <span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}
