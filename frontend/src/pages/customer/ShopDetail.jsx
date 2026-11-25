import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Bike, Clock, LayoutGrid, MapPin, PackageSearch, Search, ShoppingCart, Star } from 'lucide-react';
import { publicApi } from '../../api/customerApi.js';
import useAsync from '../../hooks/useAsync.js';
import useDebounce from '../../hooks/useDebounce.js';
import { useCart } from '../../context/CartContext.jsx';
import ProductCard from '../../components/common/ProductCard.jsx';
import SmartImage from '../../components/common/SmartImage.jsx';
import { EmptyState, ErrorState, Pagination } from '../../components/common/Feedback.jsx';
import { PageLoader } from '../../components/common/Spinner.jsx';
import { Toggle } from '../../components/common/Fields.jsx';
import { categoryIcon } from '../../utils/constants.js';
import { formatClock, formatCurrency } from '../../utils/format.js';

export default function ShopDetail() {
  const { shopId } = useParams();
  const cart = useCart();
  const [categoryId, setCategoryId] = useState(null);
  const [query, setQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(0);
  const debouncedQuery = useDebounce(query);

  const shopState = useAsync(() => publicApi.shop(shopId), [shopId]);
  const categories = useAsync(() => publicApi.categories(), []);

  useEffect(() => setPage(0), [categoryId, debouncedQuery, inStockOnly, shopId]);

  const products = useAsync(
    () =>
      publicApi.products(shopId, {
        categoryId: categoryId || undefined,
        q: debouncedQuery || undefined,
        inStockOnly,
        page,
        size: 40,
      }),
    [shopId, categoryId, debouncedQuery, inStockOnly, page],
  );

  if (shopState.error && !shopState.data) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="Shop unavailable"
        description={shopState.error}
        action={
          <Link to="/" className="font-semibold text-brand-700">
            Browse other shops
          </Link>
        }
      />
    );
  }
  if (!shopState.data) return <PageLoader />;

  const shop = shopState.data;
  const cartIsThisShop = cart.shop?.id === shop.id && cart.count > 0;

  return (
    <>
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> All shops
      </Link>

      <section className="card mb-6 overflow-hidden">
        <div className="relative h-36 sm:h-48">
          <SmartImage src={shop.imageUrl} alt={shop.name} className="h-full w-full" iconClassName="h-10 w-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/20" />
          <div className="absolute bottom-4 left-4 right-4 text-white sm:bottom-5 sm:left-6">
            <h1 className="text-2xl font-extrabold tracking-tight drop-shadow sm:text-3xl">{shop.name}</h1>
            {shop.description && <p className="mt-1 line-clamp-1 text-sm text-white/85">{shop.description}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 px-4 py-3 text-sm text-slate-600 sm:px-6">
          <span className={`inline-flex items-center gap-1.5 font-semibold ${shop.openNow ? 'text-emerald-700' : 'text-rose-600'}`}>
            <span className={`h-2 w-2 rounded-full ${shop.openNow ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {shop.openNow ? 'Open now' : 'Closed'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-slate-400" /> {formatClock(shop.openingTime)} - {formatClock(shop.closingTime)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-slate-400" /> {shop.address}, {shop.pincode}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bike className="h-4 w-4 text-slate-400" />
            {Number(shop.deliveryFee) > 0 ? `${formatCurrency(shop.deliveryFee)} delivery` : 'Free delivery'}
            {Number(shop.minOrderAmount) > 0 && ` · min ${formatCurrency(shop.minOrderAmount)}`}
          </span>
          {Number(shop.rating) > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {Number(shop.rating).toFixed(1)}
            </span>
          )}
        </div>
        {!shop.openNow && (
          <p className="border-t border-amber-100 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 sm:px-6">
            This shop is closed right now. You can fill your basket and check out once it opens at {formatClock(shop.openingTime)}.
          </p>
        )}
      </section>

      <div className="sticky top-16 z-20 -mx-4 mb-5 bg-surface/90 px-4 pb-3 pt-1 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" placeholder={`Search in ${shop.name}`} value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search products" />
          </div>
          <Toggle checked={inStockOnly} onChange={setInStockOnly} label="In stock only" />
        </div>
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <button type="button" onClick={() => setCategoryId(null)} className={`chip ${categoryId === null ? 'chip-active' : 'chip-idle'}`}>
            <LayoutGrid className="h-4 w-4" /> All aisles
          </button>
          {(categories.data || []).map((c) => {
            const Icon = categoryIcon(c.icon);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={`chip ${categoryId === c.id ? 'chip-active' : 'chip-idle'}`}
              >
                <Icon className="h-4 w-4" /> {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {products.error && !products.data ? (
        <ErrorState message={products.error} onRetry={products.reload} />
      ) : !products.data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="card aspect-[3/4] animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : products.data.content.length === 0 ? (
        <EmptyState icon={PackageSearch} title="Nothing on this shelf" description="Try another aisle or search term." />
      ) : (
        <>
          <div className={`grid grid-cols-2 gap-3 transition sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 ${products.loading ? 'opacity-60' : ''}`}>
            {products.data.content.map((product) => (
              <ProductCard key={product.id} product={product} shop={shop} />
            ))}
          </div>
          <Pagination page={products.data.page} totalPages={products.data.totalPages} onChange={setPage} />
        </>
      )}

      {cartIsThisShop && (
        <Link
          to="/cart"
          className="fixed inset-x-4 bottom-20 z-30 flex animate-slide-down items-center justify-between rounded-2xl bg-brand-600 px-4 py-3 text-white shadow-lift md:hidden"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <ShoppingCart className="h-5 w-5" />
            {cart.count} item{cart.count > 1 ? 's' : ''} · {formatCurrency(cart.subtotal)}
          </span>
          <span className="flex items-center gap-1 text-sm font-bold">
            View basket <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      )}
    </>
  );
}
