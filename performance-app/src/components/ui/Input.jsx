import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef(({ className, label, error, icon: Icon, ...props }, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-xl bg-surface-2 border border-slate-700 px-4 py-2.5 text-sm text-white',
            'placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500',
            'transition-all duration-200',
            Icon && 'pl-10',
            error && 'border-red-500 focus:ring-red-500/50',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
