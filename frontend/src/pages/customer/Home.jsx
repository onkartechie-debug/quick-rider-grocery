import { useEffect, useState } from 'react';
import { Bike, MapPin, Search, Store, X } from 'lucide-react';
import { publicApi } from '../../api/customerApi.js';
import useAsync from '../../hooks/useAsync.js';
import useDebounce from '../../hooks/useDebounce.js';
import ShopCard from '../../components/common/ShopCard.jsx';
import { EmptyState, ErrorState, Pagination } from '../../components/common/Feedback.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { PINCODE_STORAGE_KEY } from '../../utils/constants.js';

function readSavedPincode() {
  try {
    return localStorage.getItem(PINCODE_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function ShopSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="h-40 animate-pulse bg-slate-200" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [pincode, setPincode] = useState(readSavedPincode);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const debouncedQuery = useDebounce(query);
  const validPincode = /^[0-9]{6}$/.test(pincode) ? pincode : '';

  useEffect(() => {
    try {
      if (validPincode) localStorage.setItem(PINCODE_STORAGE_KEY, validPincode);
      else if (pincode === '') localStorage.removeItem(PINCODE_STORAGE_KEY);
    } catch {
      // Ignore storage errors; the pincode just won't be remembered.
    }
  }, [validPincode, pincode]);

  useEffect(() => setPage(0), [validPincode, debouncedQuery]);

  const { data, loading, error, reload } = useAsync(
    () => publicApi.shops({ pincode: validPincode || undefined, q: debouncedQuery || undefined, page, size: 12 }),
    [validPincode, debouncedQuery, page],
  );

  return (
    <>
      <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-forest-900 via-forest-800 to-brand-700 px-5 py-8 text-white sm:px-10 sm:py-12">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-400/25 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
            <Bike className="h-3.5 w-3.5" /> Delivered from shops near you
          </p>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {user ? `Hi ${user.fullName.split(' ')[0]}, what's on your list today?` : 'Fresh groceries from your neighbourhood.'}
          </h1>
          <p className="mt-2 text-sm text-emerald-100/80 sm:text-base">Pick a local shop, fill your basket and track it to your door.</p>

          <div className="mt-6 grid gap-2 sm:grid-cols-[11rem_1fr]">
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input h-12 border-0 pl-10 shadow-lg"
                inputMode="numeric"
                placeholder="Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                aria-label="Delivery pincode"
              />
              {pincode && (
                <button type="button" onClick={() => setPincode('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Clear pincode">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input h-12 border-0 pl-10 shadow-lg"
                placeholder="Search shops by name or area"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search shops"
              />
            </div>
          </div>
          {pincode && !validPincode && <p className="mt-2 text-xs text-amber-200">Enter all 6 digits to filter by pincode.</p>}
        </div>
      </section>

      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {validPincode ? `Shops delivering to ${validPincode}` : 'Shops on QuickRider'}
          </h2>
          {data && <p className="text-sm text-slate-500">{data.totalElements} shop{data.totalElements === 1 ? '' : 's'} found</p>}
        </div>
      </div>

      {error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ShopSkeleton key={i} />
          ))}
        </div>
      ) : data.content.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No shops found"
          description={validPincode ? `We don't have shops at ${validPincode} yet. Try a nearby pincode or clear the filter.` : 'Try a different search.'}
        />
      ) : (
        <>
          <div className={`grid gap-4 transition sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
            {data.content.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}
