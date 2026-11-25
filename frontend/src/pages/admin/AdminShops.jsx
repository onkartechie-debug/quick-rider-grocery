import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin, Pencil, PlusCircle, Power, Search, Store } from 'lucide-react';
import { adminApi } from '../../api/adminApi.js';
import { errorMessage } from '../../api/axiosClient.js';
import useAsync from '../../hooks/useAsync.js';
import useDebounce from '../../hooks/useDebounce.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/common/Button.jsx';
import { ConfirmDialog } from '../../components/common/Modal.jsx';
import { EmptyState, ErrorState, PageHeader, Pagination } from '../../components/common/Feedback.jsx';
import { ActiveBadge } from '../../components/common/StatusBadge.jsx';
import SmartImage from '../../components/common/SmartImage.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { formatClock } from '../../utils/format.js';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function AdminShops() {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [pendingToggle, setPendingToggle] = useState(null);
  const [toggling, setToggling] = useState(false);
  const debouncedQuery = useDebounce(query);

  useEffect(() => setPage(0), [debouncedQuery, filter]);

  const { data, loading, error, reload } = useAsync(
    () =>
      adminApi.listShops({
        q: debouncedQuery || undefined,
        active: filter === 'all' ? undefined : filter === 'active',
        page,
        size: 10,
      }),
    [debouncedQuery, filter, page],
  );

  const confirmToggle = async () => {
    if (!pendingToggle) return;
    setToggling(true);
    try {
      await adminApi.setShopStatus(pendingToggle.id, !pendingToggle.active);
      toast.success(`${pendingToggle.name} ${pendingToggle.active ? 'deactivated' : 'activated'}`);
      setPendingToggle(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setToggling(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Shops"
        subtitle="Onboard, edit and control which shops are visible to customers."
        actions={
          <Link to="/admin/shops/new">
            <Button icon={PlusCircle}>Onboard shop</Button>
          </Link>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Search by shop name, city or pincode"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search shops"
          />
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`chip ${filter === f.value ? 'chip-active' : 'chip-idle'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : data.content.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No shops found"
          description={query || filter !== 'all' ? 'Try a different search or filter.' : 'Onboard your first grocery shop to get started.'}
        />
      ) : (
        <div className={`space-y-3 transition ${loading ? 'opacity-60' : ''}`}>
          {data.content.map((shop) => (
            <article key={shop.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <SmartImage src={shop.imageUrl} alt={shop.name} className="h-32 w-full rounded-xl sm:h-20 sm:w-28 sm:shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-slate-900">{shop.name}</h3>
                  <ActiveBadge active={shop.active} />
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {shop.address}, {shop.city} {shop.pincode}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {formatClock(shop.openingTime)} - {formatClock(shop.closingTime)} ·{' '}
                    {Number(shop.deliveryRadiusKm)} km radius
                  </span>
                </div>
                {shop.owner && (
                  <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-slate-600">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-medium">{shop.owner.fullName}</span> · {shop.owner.email}
                  </p>
                )}
              </div>
              <div className="flex gap-2 sm:shrink-0">
                <Link to={`/admin/shops/${shop.id}/edit`} className="flex-1 sm:flex-none">
                  <Button variant="secondary" size="sm" icon={Pencil} className="w-full">
                    Edit
                  </Button>
                </Link>
                <Button
                  variant={shop.active ? 'danger-soft' : 'soft'}
                  size="sm"
                  icon={Power}
                  className="flex-1 sm:flex-none"
                  onClick={() => setPendingToggle(shop)}
                >
                  {shop.active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </article>
          ))}
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!pendingToggle}
        onClose={() => setPendingToggle(null)}
        onConfirm={confirmToggle}
        loading={toggling}
        variant={pendingToggle?.active ? 'danger' : 'primary'}
        title={pendingToggle?.active ? 'Deactivate shop?' : 'Activate shop?'}
        confirmLabel={pendingToggle?.active ? 'Deactivate' : 'Activate'}
        message={
          pendingToggle?.active
            ? `${pendingToggle?.name} will disappear from the storefront and stop accepting new orders. Existing orders can still be fulfilled.`
            : `${pendingToggle?.name} will be visible to customers and can start accepting orders.`
        }
      />
    </>
  );
}
