import { cn } from '@/lib/utils';

export function Card({ className, children, glow, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-800/50 bg-surface-1 p-4 md:p-5',
        glow && 'shadow-lg shadow-brand-500/5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('flex items-center justify-between mb-3', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, icon: Icon, ...props }) {
  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      {Icon && <Icon className="w-4 h-4 text-brand-400" />}
      <h3 className="font-semibold text-sm text-slate-200">{children}</h3>
    </div>
  );
}
