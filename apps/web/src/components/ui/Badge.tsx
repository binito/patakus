import { clsx } from 'clsx';

type BadgeStatus =
  | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'PENDING' | 'APPROVED'
  | 'REJECTED' | 'DELIVERED' | 'COMPLETED' | 'DRAFT' | 'CONFIRMED'
  | 'CANCELLED' | 'ORDERED' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  | 'ACTIVE' | 'INACTIVE';

const statusConfig: Record<BadgeStatus, { label: string; className: string }> = {
  OPEN:        { label: 'Aberto',       className: 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/30' },
  IN_PROGRESS: { label: 'Em Andamento', className: 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30' },
  RESOLVED:    { label: 'Resolvido',    className: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30' },
  PENDING:     { label: 'Pendente',     className: 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30' },
  APPROVED:    { label: 'Aprovado',     className: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30' },
  REJECTED:    { label: 'Rejeitado',    className: 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/30' },
  DELIVERED:   { label: 'Entregue',     className: 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/30' },
  COMPLETED:   { label: 'Concluído',    className: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30' },
  LOW:         { label: 'Baixa',        className: 'bg-white/10 text-white/60 ring-1 ring-white/20' },
  MEDIUM:      { label: 'Média',        className: 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30' },
  HIGH:        { label: 'Alta',         className: 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-400/30' },
  CRITICAL:    { label: 'Crítica',      className: 'bg-rose-500/30 text-rose-200 ring-1 ring-rose-400/50' },
  DRAFT:       { label: 'Rascunho',     className: 'bg-white/10 text-white/50 ring-1 ring-white/15' },
  CONFIRMED:   { label: 'Confirmado',   className: 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/30' },
  CANCELLED:   { label: 'Cancelado',    className: 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/30' },
  ORDERED:     { label: 'Encomendado',  className: 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/30' },
  ACTIVE:      { label: 'Ativo',        className: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30' },
  INACTIVE:    { label: 'Inativo',      className: 'bg-white/10 text-white/40 ring-1 ring-white/15' },
};

interface BadgeProps {
  status: BadgeStatus;
  className?: string;
}

export function Badge({ status, className }: BadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-white/10 text-white/60 ring-1 ring-white/20' };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
