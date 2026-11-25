import { Loader2 } from 'lucide-react';

export default function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`animate-spin text-brand-600 ${className}`} aria-label="Loading" />;
}

export function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-sm text-slate-500">
      <Spinner className="h-8 w-8" />
      {label}
    </div>
  );
}
