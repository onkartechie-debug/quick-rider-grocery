import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, MapPin, Phone, Receipt, RefreshCw, Store } from 'lucide-react';
import { customerApi } from '../../api/customerApi.js';
import { errorMessage } from '../../api/axiosClient.js';
import useAsync from '../../hooks/useAsync.js';
import useInterval from '../../hooks/useInterval.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/common/Button.jsx';
import { ConfirmDialog } from '../../components/common/Modal.jsx';
import { TextArea } from '../../components/common/Fields.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import StatusTracker from '../../components/common/StatusTracker.jsx';
import { EmptyState } from '../../components/common/Feedback.jsx';
import { PageLoader } from '../../components/common/Spinner.jsx';
import { ACTIVE_STATUSES, ORDER_STATUS_META, PAYMENT_METHODS } from '../../utils/constants.js';
import { formatCurrency, formatDateTime } from '../../utils/format.js';

const POLL_MS = 15000;

export default function OrderTracking() {
  const { orderId } = useParams();
  const toast = useToast();
  const { data: order, error, loading, reload, setData } = useAsync(() => customerApi.order(orderId), [orderId]);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const isActive = order && ACTIVE_STATUSES.includes(order.status);
  useInterval(reload, isActive ? POLL_MS : null);

  if (error && !order) {
    return (
      <EmptyState
        icon={Receipt}
        title="Order not found"
        description={error}
        action={
          <Link to="/orders" className="font-semibold text-brand-700">
            Back to my orders
          </Link>
        }
      />
    );
  }
  if (!order) return <PageLoader />;

  const cancel = async () => {
    setCancelling(true);
    try {
      const { data } = await customerApi.cancelOrder(order.id, reason.trim() || null);
      setData(data);
      setConfirmCancel(false);
      toast.success('Your order has been cancelled');
    } catch (err) {
      toast.error(errorMessage(err));
      reload();
    } finally {
      setCancelling(false);
    }
  };

  const payment = PAYMENT_METHODS.find((p) => p.value === order.paymentMethod)?.label || order.paymentMethod;

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/orders" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> My orders
      </Link>

      <section className="card mb-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-sm font-bold text-slate-500">{order.orderNumber}</p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{ORDER_STATUS_META[order.status].customerText}</h1>
            <p className="mt-1 text-sm text-slate-500">Placed {formatDateTime(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            {isActive && (
              <Button variant="ghost" size="icon" onClick={reload} aria-label="Refresh status">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
        <div className="mt-6">
          <StatusTracker status={order.status} history={order.history} cancelReason={order.cancelReason} />
        </div>
        {isActive && <p className="mt-4 text-xs text-slate-400">Live updates every {POLL_MS / 1000} seconds.</p>}
      </section>

      <div className="grid gap-5 md:grid-cols-5">
        <section className="card p-5 md:col-span-3">
          <h2 className="text-base font-semibold text-slate-900">Items</h2>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 py-2.5">
                <span className="text-slate-700">
                  <span className="font-bold text-slate-900">{item.quantity} ×</span> {item.productName}{' '}
                  <span className="text-xs text-slate-400">({item.unit})</span>
                </span>
                <span className="shrink-0 font-medium tabular-nums">{formatCurrency(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-2 border-t border-dashed border-slate-200 pt-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <dt>Item total</dt>
              <dd className="tabular-nums">{formatCurrency(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>Delivery fee</dt>
              <dd className="tabular-nums">{Number(order.deliveryFee) > 0 ? formatCurrency(order.deliveryFee) : 'Free'}</dd>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900">
              <dt>Total ({payment})</dt>
              <dd className="tabular-nums">{formatCurrency(order.totalAmount)}</dd>
            </div>
          </dl>
        </section>

        <section className="space-y-5 md:col-span-2">
          <div className="card space-y-4 p-5 text-sm">
            <div className="flex gap-3">
              <Store className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-900">{order.shopName}</p>
                {order.shopPhone && (
                  <a href={`tel:${order.shopPhone}`} className="inline-flex items-center gap-1 text-brand-700 hover:underline">
                    <Phone className="h-3.5 w-3.5" /> Call shop
                  </a>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-900">{order.deliveryName}</p>
                <p className="text-slate-600">{order.deliveryAddress}</p>
                <p className="text-slate-500">{order.deliveryPhone}</p>
              </div>
            </div>
            {order.notes && <p className="rounded-xl bg-slate-50 px-3 py-2 text-slate-600">Note: {order.notes}</p>}
          </div>

          {order.status === 'PLACED' && (
            <Button variant="danger-soft" icon={Ban} className="w-full" onClick={() => setConfirmCancel(true)}>
              Cancel order
            </Button>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={cancel}
        loading={cancelling}
        variant="danger"
        title="Cancel this order?"
        confirmLabel="Cancel order"
        message="You can cancel until the shop accepts your order."
      >
        <TextArea label="Reason (optional)" name="reason" className="mt-4" maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
      </ConfirmDialog>
    </div>
  );
}
