import { Link } from 'react-router-dom';
import { Bike, Clock, MapPin, Star } from 'lucide-react';
import SmartImage from './SmartImage.jsx';
import { formatClock, formatCurrency } from '../../utils/format.js';

export default function ShopCard({ shop }) {
  return (
    <Link
      to={`/shops/${shop.id}`}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25"
    >
      <div className="relative h-40 overflow-hidden">
        <SmartImage src={shop.imageUrl} alt={shop.name} className="h-full w-full transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/0" />
        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur ${
            shop.openNow ? 'bg-white/90 text-emerald-700' : 'bg-slate-900/70 text-white'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${shop.openNow ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          {shop.openNow ? 'Open now' : `Opens ${formatClock(shop.openingTime)}`}
        </span>
        {Number(shop.rating) > 0 && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-bold text-slate-800 backdrop-blur">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {Number(shop.rating).toFixed(1)}
          </span>
        )}
        <h3 className="absolute bottom-3 left-3 right-3 truncate text-lg font-bold text-white drop-shadow">{shop.name}</h3>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {shop.description && <p className="line-clamp-2 text-sm text-slate-500">{shop.description}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            {shop.city} {shop.pincode}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            {formatClock(shop.openingTime)} - {formatClock(shop.closingTime)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Bike className="h-3.5 w-3.5 text-slate-400" />
            {Number(shop.deliveryFee) > 0 ? `${formatCurrency(shop.deliveryFee)} delivery` : 'Free delivery'}
          </span>
        </div>
      </div>
    </Link>
  );
}
