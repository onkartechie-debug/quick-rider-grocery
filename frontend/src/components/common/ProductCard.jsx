import { Plus } from 'lucide-react';
import SmartImage from './SmartImage.jsx';
import QuantityStepper from './QuantityStepper.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { formatCurrency } from '../../utils/format.js';
import { MAX_QTY_PER_ITEM } from '../../utils/constants.js';

export default function ProductCard({ product, shop, disabled = false }) {
  const { quantityOf, addItem, setQuantity } = useCart();
  const quantity = quantityOf(product.id);
  const max = Math.min(product.stockQuantity, MAX_QTY_PER_ITEM);
  const outOfStock = !product.inStock;
  const lowStock = product.inStock && product.stockQuantity <= 5;

  return (
    <div className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <SmartImage
          src={product.imageUrl}
          alt={product.name}
          className={`h-full w-full transition duration-300 group-hover:scale-105 ${outOfStock ? 'grayscale' : ''}`}
        />
        {product.discountPercent > 0 && (
          <span className="absolute left-2 top-2 rounded-lg bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white shadow">
            {product.discountPercent}% OFF
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
            <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white">Out of stock</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{product.unit}</p>
        <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{product.name}</h3>
        {lowStock && <p className="mt-1 text-[11px] font-semibold text-amber-600">Only {product.stockQuantity} left</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-900">{formatCurrency(product.effectivePrice)}</p>
            {product.discountedPrice && Number(product.discountedPrice) < Number(product.price) && (
              <p className="text-xs text-slate-400 line-through">{formatCurrency(product.price)}</p>
            )}
          </div>
          {quantity > 0 ? (
            <QuantityStepper
              size="sm"
              value={quantity}
              max={max}
              onIncrement={() => setQuantity(product.id, quantity + 1)}
              onDecrement={() => setQuantity(product.id, quantity - 1)}
            />
          ) : (
            <button
              type="button"
              disabled={outOfStock || disabled}
              onClick={() => addItem(product, shop)}
              className="inline-flex h-8 items-center gap-1 rounded-xl border border-brand-600 bg-brand-50 px-3 text-xs font-bold text-brand-700 transition hover:bg-brand-600 hover:text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={3} />
              ADD
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
