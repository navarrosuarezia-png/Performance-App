import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export const Select = forwardRef(({ className, label, options = [], placeholder, error, ...props }, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'w-full rounded-xl bg-surface-2 border border-slate-700 px-4 py-2.5 text-sm text-white',
            'appearance-none focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500',
            'transition-all duration-200',
            error && 'border-red-500',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
