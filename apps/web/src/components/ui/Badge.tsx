import { clsx } from 'clsx';

type BadgeStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DRAFT'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'ORDERED'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'
  | 'ACTIVE'
  | 'INACTIVE';

const statusConfig: Record<BadgeStatus, { label: string; className: string }> = {
  OPEN: { label: 'Aberto', className: 'bg-red-100 text-red-700' },
  IN_PROGRESS: { label: 'Em Andamento', className: 'bg-yellow-100 text-yellow-700' },
  RESOLVED: { label: 'Resolvido', className: 'bg-green-100 text-green-700' },
  PENDING: { label: 'Pendente', className: 'bg-orange-100 text-orange-700' },
  APPROVED: { label: 'Aprovado', className: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejeitado', className: 'bg-red-100 text-red-700' },
  DELIVERED: { label: 'Entregue', className: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Concluído', className: 'bg-green-100 text-green-700' },
  LOW: { label: 'Baixa', className: 'bg-gray-100 text-gray-700' },
  MEDIUM: { label: 'Média', className: 'bg-yellow-100 text-yellow-700' },
  HIGH: { label: 'Alta', className: 'bg-orange-100 text-orange-700' },
  CRITICAL: { label: 'Crítica', className: 'bg-red-100 text-red-700' },
  DRAFT: { label: 'Rascunho', className: 'bg-gray-100 text-gray-600' },
  CONFIRMED: { label: 'Confirmado', className: 'bg-blue-100 text-blue-700' },
  CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-700' },
  ORDERED: { label: 'Encomendado', className: 'bg-blue-100 text-blue-700' },
  ACTIVE: { label: 'Ativo', className: 'bg-green-100 text-green-700' },
  INACTIVE: { label: 'Inativo', className: 'bg-gray-100 text-gray-500' },
};

interface BadgeProps {
  status: BadgeStatus;
  className?: string;
}

export function Badge({ status, className }: BadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' };

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
