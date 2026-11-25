import { Link } from 'react-router-dom';
import { ShoppingBasket } from 'lucide-react';

export default function Logo({ to = '/', compact = false, inverted = false }) {
  return (
    <Link to={to} className="flex items-center gap-2.5" aria-label="QuickRider home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/30">
        <ShoppingBasket className="h-5 w-5" strokeWidth={2.4} />
      </span>
      {!compact && (
        <span className={`text-lg font-extrabold tracking-tight ${inverted ? 'text-white' : 'text-slate-900'}`}>
          Quick<span className={inverted ? 'text-brand-300' : 'text-brand-600'}>Rider</span>
        </span>
      )}
    </Link>
  );
}
