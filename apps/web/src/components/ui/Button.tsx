'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'rounded-full bg-primary-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] hover:bg-primary-400 hover:shadow-[0_0_28px_rgba(99,102,241,0.5)] active:scale-[0.98] focus:ring-primary-500/50 disabled:opacity-40 disabled:shadow-none',
  secondary:
    'rounded-lg bg-surface-3 text-gray-200 ring-1 ring-white/10 hover:bg-surface-3/70 hover:ring-white/15 active:scale-[0.98] focus:ring-gray-600 disabled:opacity-40',
  danger:
    'rounded-lg bg-red-600/90 text-white hover:bg-red-500 active:scale-[0.98] focus:ring-red-500 disabled:opacity-40',
  ghost:
    'rounded-lg bg-transparent text-gray-500 hover:bg-surface-2 hover:text-gray-200 active:scale-[0.98] focus:ring-gray-700 disabled:opacity-30',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm:  'px-3 py-1.5 text-xs gap-1.5',
  md:  'px-4 py-2 text-sm gap-2',
  lg:  'px-6 py-2.5 text-sm gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center font-medium transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-0',
          'disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
