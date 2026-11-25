import { Link } from 'react-router-dom';
import { ArrowRight, IndianRupee, PlusCircle, Receipt, Store, Users } from 'lucide-react';
import { adminApi } from '../../api/adminApi.js';
import useAsync from '../../hooks/useAsync.js';
import Button from '../../components/common/Button.jsx';
import { ErrorState, PageHeader, StatCard } from '../../components/common/Feedback.jsx';
import { PageLoader } from '../../components/common/Spinner.jsx';
import { ORDER_STATUS_META } from '../../utils/constants.js';
import { formatCurrency } from '../../utils/format.js';

const BAR_COLORS = {
  PLACED: 'bg-sky-500',
  ACCEPTED: 'bg-indigo-500',
  PACKING: 'bg-amber-500',
  OUT_FOR_DELIVERY: 'bg-violet-500',
  DELIVERED: 'bg-emerald-500',
  CANCELLED: 'bg-rose-500',
};

export default function AdminDashboard() {
  const { data, loading, error, reload } = useAsync(() => adminApi.metrics(), []);

  if (loading && !data) return <PageLoader />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const statusEntries = Object.entries(data.ordersByStatus || {});
  const maxCount = Math.max(1, ...statusEntries.map(([, count]) => count));

  return (
    <>
      <PageHeader
        title="Platform overview"
        subtitle="A live snapshot of shops, orders and people on QuickRider."
        actions={
          <Link to="/admin/shops/new">
            <Button icon={PlusCircle}>Onboard a shop</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={Store} label="Shops" value={data.totalShops} hint={`${data.activeShops} active`} />
        <StatCard icon={Receipt} label="Orders" value={data.totalOrders} hint={`${data.ordersToday} today`} tone="sky" />
        <StatCard
          icon={IndianRupee}
          label="Delivered GMV"
          value={formatCurrency(data.deliveredRevenue)}
          hint="Value of delivered orders"
          tone="amber"
        />
        <StatCard
          icon={Users}
          label="Active users"
          value={data.activeUsers}
          hint={`${data.totalCustomers} customers · ${data.totalShopkeepers} shopkeepers`}
          tone="violet"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-900">Orders by status</h2>
          <p className="text-sm text-slate-500">All-time distribution across the fulfilment pipeline.</p>
          <ul className="mt-5 space-y-3.5">
            {statusEntries.map(([status, count]) => (
              <li key={status} className="grid grid-cols-[8.5rem_1fr_2.5rem] items-center gap-3 text-sm">
                <span className="truncate font-medium text-slate-600">{ORDER_STATUS_META[status]?.label || status}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <span
                    className={`block h-full rounded-full ${BAR_COLORS[status]}`}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </span>
                <span className="text-right font-semibold tabular-nums text-slate-900">{count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card flex flex-col justify-between bg-gradient-to-br from-forest-800 to-brand-700 p-5 text-white">
          <div>
            <h2 className="text-base font-semibold">Grow the network</h2>
            <p className="mt-1 text-sm text-emerald-100/80">
              Onboard a new grocery shop and create its shopkeeper account in a single step.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/admin/shops/new"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-forest-800 transition hover:bg-emerald-50"
            >
              <PlusCircle className="h-4 w-4" /> Onboard shop
            </Link>
            <Link
              to="/admin/shops"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/15"
            >
              Manage shops <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
