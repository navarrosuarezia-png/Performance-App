import { cn } from '@/lib/utils';

const variants = {
  primary: 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white shadow-lg shadow-brand-500/25',
  secondary: 'bg-surface-2 hover:bg-surface-3 text-slate-200 border border-slate-700',
  danger: 'bg-red-600 hover:bg-red-500 text-white',
  ghost: 'hover:bg-surface-2 text-slate-300',
  success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-base',
  xl: 'px-8 py-4 text-lg',
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  children,
  icon: Icon,
  loading,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
}
