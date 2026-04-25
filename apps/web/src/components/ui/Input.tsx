'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-white/80">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full rounded-md border px-3 py-2 text-sm text-white placeholder-white/30',
            'bg-white/10 backdrop-blur-sm',
            'transition-colors focus:outline-none focus:ring-2 focus:border-transparent',
            error
              ? 'border-rose-400/60 focus:ring-rose-400/60'
              : 'border-white/20 hover:border-white/40 focus:ring-primary-400/60',
            'disabled:cursor-not-allowed disabled:opacity-40',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-300">{error}</p>}
        {hint && !error && <p className="text-xs text-white/40">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
