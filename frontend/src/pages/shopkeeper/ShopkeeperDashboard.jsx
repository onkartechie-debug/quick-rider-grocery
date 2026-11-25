import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Boxes, ClipboardList, Clock, IndianRupee, MapPin, Package, Receipt } from 'lucide-react';
import { shopkeeperApi } from '../../api/shopkeeperApi.js';
import useAsync from '../../hooks/useAsync.js';
import useInterval from '../../hooks/useInterval.js';
import { EmptyState, ErrorState, PageHeader, StatCard } from '../../components/common/Feedback.jsx';
import { PageLoader } from '../../components/common/Spinner.jsx';
import StatusBadge, { ActiveBadge } from '../../components/common/StatusBadge.jsx';
import SmartImage from '../../components/common/SmartImage.jsx';
import { formatClock, formatCurrency, formatDateTime } from '../../utils/format.js';
import { ORDER_PIPELINE, ORDER_STATUS_META } from '../../utils/constants.js';

export default function ShopkeeperDashboard() {
  const { data, error, reload } = useAsync(async () => {
    const [shop, dashboard, newOrders] = await Promise.all([
      shopkeeperApi.shop(),
      shopkeeperApi.dashboard(),
      shopkeeperApi.orders({ status: ['PLACED'], size: 5 }),
    ]);
    return { shop: shop.data, dashboard: dashboard.data, newOrders: newOrders.data.content };
  }, []);

  useInterval(reload, 30000);

  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <PageLoader />;

  const { shop, dashboard, newOrders } = data;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Today's activity at your shop. Refreshes every 30 seconds." />

      <section className="card mb-6 flex flex-col overflow-hidden sm:flex-row">
        <SmartImage src={shop.imageUrl} alt={shop.name} className="h-36 w-full sm:h-auto sm:w-56" />
        <div className="flex flex-1 flex-col justify-center gap-2 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">{shop.name}</h2>
            <ActiveBadge active={shop.active} activeLabel="Listed" inactiveLabel="Hidden by admin" />
            <ActiveBadge active={shop.openNow} activeLabel="Open now" inactiveLabel="Closed now" />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {shop.address}, {shop.city} {shop.pincode}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" /> {formatClock(shop.openingTime)} - {formatClock(shop.closingTime)}
            </span>
          </div>
          {!shop.active && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-amber-700">
              <AlertTriangle className="h-4 w-4" /> Your shop is not visible to customers. Contact the QuickRider admin.
            </p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={Receipt} label="Orders today" value={dashboard.ordersToday} tone="sky" />
        <StatCard icon={IndianRupee} label="Sales today" value={formatCurrency(dashboard.revenueToday)} hint="Excludes cancelled" />
        <StatCard icon={ClipboardList} label="Active orders" value={dashboard.activeOrders} hint="Need your attention" tone="violet" />
        <StatCard
          icon={Boxes}
          label="Low stock"
          value={dashboard.lowStockProducts}
          hint={`of ${dashboard.totalProducts} products`}
          tone={dashboard.lowStockProducts > 0 ? 'rose' : 'amber'}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">New orders</h2>
              <p className="text-sm text-slate-500">Waiting to be accepted</p>
            </div>
            <Link to="/shopkeeper/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
              All orders <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {newOrders.length === 0 ? (
            <EmptyState icon={Package} title="You're all caught up" description="New orders will appear here automatically." className="border-dashed shadow-none" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {newOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {order.orderNumber} · {order.deliveryName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {order.itemCount} items · {formatCurrency(order.totalAmount)} · {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="text-base font-semibold text-slate-900">Pipeline</h2>
          <p className="text-sm text-slate-500">All-time orders by stage</p>
          <ul className="mt-4 space-y-2.5">
            {[...ORDER_PIPELINE, 'CANCELLED'].map((status) => {
              const Icon = ORDER_STATUS_META[status].icon;
              return (
                <li key={status} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
                  <span className="inline-flex items-center gap-2 font-medium text-slate-600">
                    <Icon className="h-4 w-4 text-slate-400" />
                    {ORDER_STATUS_META[status].label}
                  </span>
                  <span className="font-bold tabular-nums text-slate-900">{dashboard.ordersByStatus?.[status] ?? 0}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
