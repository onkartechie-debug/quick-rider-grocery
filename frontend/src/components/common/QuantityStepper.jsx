import { Minus, Plus } from 'lucide-react';

export default function QuantityStepper({ value, onIncrement, onDecrement, max, size = 'md' }) {
  const atMax = max !== undefined && value >= max;
  const dims = size === 'sm' ? 'h-8 text-sm' : 'h-9 text-sm';
  const btn = size === 'sm' ? 'w-8' : 'w-9';
  return (
    <div className={`inline-flex items-center overflow-hidden rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/25 ${dims}`}>
      <button
        type="button"
        onClick={onDecrement}
        className={`flex h-full ${btn} items-center justify-center transition hover:bg-brand-700`}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <span className="min-w-[1.75rem] text-center font-bold tabular-nums">{value}</span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={atMax}
        className={`flex h-full ${btn} items-center justify-center transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50`}
        aria-label="Increase quantity"
        title={atMax ? 'No more stock available' : undefined}
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}
