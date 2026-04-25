import { clsx } from 'clsx';

type BadgeStatus =
  | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'PENDING' | 'APPROVED'
  | 'REJECTED' | 'DELIVERED' | 'COMPLETED' | 'DRAFT' | 'CONFIRMED'
  | 'CANCELLED' | 'ORDERED' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  | 'ACTIVE' | 'INACTIVE';

const statusConfig: Record<BadgeStatus, { label: string; className: string }> = {
  OPEN:        { label: 'Aberto',       className: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/25' },
  IN_PROGRESS: { label: 'Em Andamento', className: 'bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/25' },
  RESOLVED:    { label: 'Resolvido',    className: 'bg-green-500/15 text-green-400 ring-1 ring-green-500/25' },
  PENDING:     { label: 'Pendente',     className: 'bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/25' },
  APPROVED:    { label: 'Aprovado',     className: 'bg-green-500/15 text-green-400 ring-1 ring-green-500/25' },
  REJECTED:    { label: 'Rejeitado',    className: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/25' },
  DELIVERED:   { label: 'Entregue',     className: 'bg-primary-500/15 text-primary-400 ring-1 ring-primary-500/25' },
  COMPLETED:   { label: 'Concluído',    className: 'bg-green-500/15 text-green-400 ring-1 ring-green-500/25' },
  LOW:         { label: 'Baixa',        className: 'bg-surface-3 text-gray-400 ring-1 ring-border' },
  MEDIUM:      { label: 'Média',        className: 'bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/25' },
  HIGH:        { label: 'Alta',         className: 'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/25' },
  CRITICAL:    { label: 'Crítica',      className: 'bg-red-500/25 text-red-300 ring-1 ring-red-500/40 font-semibold' },
  DRAFT:       { label: 'Rascunho',     className: 'bg-surface-3 text-gray-500 ring-1 ring-border' },
  CONFIRMED:   { label: 'Confirmado',   className: 'bg-primary-500/15 text-primary-400 ring-1 ring-primary-500/25' },
  CANCELLED:   { label: 'Cancelado',    className: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/25' },
  ORDERED:     { label: 'Encomendado',  className: 'bg-primary-500/15 text-primary-400 ring-1 ring-primary-500/25' },
  ACTIVE:      { label: 'Ativo',        className: 'bg-green-500/15 text-green-400 ring-1 ring-green-500/25' },
  INACTIVE:    { label: 'Inativo',      className: 'bg-surface-3 text-gray-500 ring-1 ring-border' },
};

interface BadgeProps {
  status: BadgeStatus;
  className?: string;
}

export function Badge({ status, className }: BadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-surface-3 text-gray-400 ring-1 ring-border' };
  return (
    <span className={clsx('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', config.className, className)}>
      {config.label}
    </span>
  );
}
