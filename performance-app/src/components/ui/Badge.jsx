import { cn } from '@/lib/utils';

const variants = {
  default: 'bg-surface-3 text-slate-300',
  success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  danger: 'bg-red-500/15 text-red-400 border border-red-500/20',
  info: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20',
  brand: 'bg-brand-500/15 text-brand-400 border border-brand-500/20',
};

export function Badge({ className, variant = 'default', children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
