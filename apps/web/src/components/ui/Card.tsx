import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6' };

export function Card({ padding = 'md', className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl bg-gradient-to-b from-surface-2 to-[#17171a]',
        'ring-1 ring-white/[0.07] shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]',
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('mb-4 flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={clsx('text-sm font-semibold text-gray-200', className)} {...props}>
      {children}
    </h3>
  );
}
