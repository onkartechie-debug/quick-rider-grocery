import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-brand-600 text-white shadow-sm shadow-brand-600/25 hover:bg-brand-700 focus-visible:ring-brand-500/30',
  secondary: 'border border-slate-300 bg-white text-slate-800 shadow-sm hover:bg-slate-50 focus-visible:ring-slate-400/25',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100 focus-visible:ring-brand-500/25',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400/25',
  danger: 'bg-rose-600 text-white shadow-sm shadow-rose-600/25 hover:bg-rose-700 focus-visible:ring-rose-500/30',
  'danger-soft': 'bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-500/25',
};

const SIZES = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-5 text-base',
  icon: 'h-9 w-9',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  type = 'button',
  className = '',
  disabled,
  children,
  ...props
}) {
  const iconSize = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-4 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className={`${iconSize} animate-spin`} /> : Icon ? <Icon className={iconSize} /> : null}
      {children}
      {IconRight && !loading ? <IconRight className={iconSize} /> : null}
    </button>
  );
}
