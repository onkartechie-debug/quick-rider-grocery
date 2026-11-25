import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Receipt, Store } from 'lucide-react';
import { customerApi } from '../../api/customerApi.js';
import useAsync from '../../hooks/useAsync.js';
import useInterval from '../../hooks/useInterval.js';
import Button from '../../components/common/Button.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { EmptyState, ErrorState, PageHeader, Pagination } from '../../components/common/Feedback.jsx';
import { ACTIVE_STATUSES, ORDER_STATUS_META } from '../../utils/constants.js';
import { formatCurrency, formatDateTime } from '../../utils/format.js';

export default function Orders() {
  const [page, setPage] = useState(0);
  const { data, error, reload } = useAsync(() => customerApi.orders({ page, size: 10 }), [page]);

  const hasActive = data?.content.some((o) => ACTIVE_STATUSES.includes(o.status));
  useInterval(reload, hasActive ? 20000 : null);

  return (
    <>
      <PageHeader title="My orders" subtitle="Track active orders and revisit past baskets." />

      {error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : data.content.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No orders yet"
          description="When you place an order, you'll be able to track it here."
          action={
            <Link to="/">
              <Button icon={Store}>Start shopping</Button>
            </Link>
          }
        />
      ) : (
        <>
          <ul className="space-y-3">
            {data.content.map((order) => {
              const active = ACTIVE_STATUSES.includes(order.status);
              return (
                <li key={order.id}>
                  <Link
                    to={`/orders/${order.id}`}
                    className={`card flex items-center gap-4 p-4 transition hover:shadow-lift ${active ? 'border-brand-200 ring-1 ring-brand-500/10' : ''}`}
                  >
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-500'}`}>
                      <Store className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-slate-900">{order.shopName}</p>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {order.orderNumber} · {formatDateTime(order.createdAt)} · {order.itemCount} item{order.itemCount === 1 ? '' : 's'}
                      </p>
                      {active && <p className="mt-1 text-xs font-medium text-brand-700">{ORDER_STATUS_META[order.status].customerText}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold tabular-nums text-slate-900">{formatCurrency(order.totalAmount)}</span>
                      <ChevronRight className="h-5 w-5 text-slate-300" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}
