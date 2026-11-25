import { Ban, Check } from 'lucide-react';
import { ORDER_PIPELINE, ORDER_STATUS_META } from '../../utils/constants.js';
import { formatTimeOnly } from '../../utils/format.js';

/** Visual order progress. Vertical on mobile, horizontal on wider screens. */
export default function StatusTracker({ status, history = [], cancelReason }) {
  const timeFor = (step) => {
    const entry = [...history].reverse().find((h) => h.status === step);
    return entry ? formatTimeOnly(entry.changedAt) : null;
  };

  if (status === 'CANCELLED') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white">
          <Ban className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold text-rose-900">Order cancelled</p>
          {cancelReason && <p className="mt-0.5 text-sm text-rose-700">Reason: {cancelReason}</p>}
          {timeFor('CANCELLED') && <p className="mt-1 text-xs text-rose-600">at {timeFor('CANCELLED')}</p>}
        </div>
      </div>
    );
  }

  const currentIndex = ORDER_PIPELINE.indexOf(status);

  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-start">
      {ORDER_PIPELINE.map((step, index) => {
        const meta = ORDER_STATUS_META[step];
        const Icon = meta.icon;
        const done = index < currentIndex || status === 'DELIVERED';
        const current = index === currentIndex && status !== 'DELIVERED';
        const isLast = index === ORDER_PIPELINE.length - 1;
        return (
          <li key={step} className="relative flex flex-1 gap-3 pb-6 sm:flex-col sm:items-center sm:gap-2 sm:pb-0 sm:text-center">
            {!isLast && (
              <span
                aria-hidden="true"
                className={`absolute left-5 top-10 h-[calc(100%-2.5rem)] w-0.5 sm:left-[calc(50%+1.25rem)] sm:top-5 sm:h-0.5 sm:w-[calc(100%-2.5rem)] ${
                  index < currentIndex || status === 'DELIVERED' ? 'bg-brand-500' : 'bg-slate-200'
                }`}
              />
            )}
            <span
              className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition ${
                done
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : current
                    ? 'border-brand-500 bg-white text-brand-600 ring-4 ring-brand-500/15'
                    : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              {done ? <Check className="h-5 w-5" strokeWidth={3} /> : <Icon className="h-5 w-5" />}
              {current && <span className="absolute inset-0 animate-ping rounded-full border-2 border-brand-400 opacity-40" />}
            </span>
            <div className="pt-1.5 sm:pt-0">
              <p className={`text-sm font-semibold ${done || current ? 'text-slate-900' : 'text-slate-400'}`}>{meta.label}</p>
              {timeFor(step) && <p className="text-xs text-slate-500">{timeFor(step)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
