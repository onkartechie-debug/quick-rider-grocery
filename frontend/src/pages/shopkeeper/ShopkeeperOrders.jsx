import { useEffect, useState } from 'react';
import { Ban, ClipboardList, MapPin, Phone, RefreshCw, StickyNote } from 'lucide-react';
import { shopkeeperApi } from '../../api/shopkeeperApi.js';
import { errorMessage } from '../../api/axiosClient.js';
import useAsync from '../../hooks/useAsync.js';
import useInterval from '../../hooks/useInterval.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import { TextArea } from '../../components/common/Fields.jsx';
import { EmptyState, ErrorState, PageHeader, Pagination } from '../../components/common/Feedback.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { ORDER_STATUS_META, PAYMENT_METHODS } from '../../utils/constants.js';
import { formatCurrency, formatDateTime } from '../../utils/format.js';

const TABS = [
  { key: 'new', label: 'New', statuses: ['PLACED'] },
  { key: 'progress', label: 'In progress', statuses: ['ACCEPTED', 'PACKING', 'OUT_FOR_DELIVERY'] },
  { key: 'delivered', label: 'Delivered', statuses: ['DELIVERED'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['CANCELLED'] },
  { key: 'all', label: 'All', statuses: [] },
];

const CANCEL_REASONS = ['Items out of stock', 'Shop closing early', 'Address outside delivery area', 'Unable to reach customer'];

function OrderCard({ order, onAdvance, onCancel, busy }) {
  const forward = order.nextStatuses.filter((s) => s !== 'CANCELLED');
  const canCancel = order.nextStatuses.includes('CANCELLED');
  const payment = PAYMENT_METHODS.find((p) => p.value === order.paymentMethod)?.label || order.paymentMethod;

  return (
    <article className="card flex flex-col p-4 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-sm font-bold text-slate-900">{order.orderNumber}</p>
          <p className="text-xs text-slate-500">{formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </header>

      <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-3 text-sm">
        <p className="font-semibold text-slate-900">{order.deliveryName}</p>
        <p className="flex items-start gap-1.5 text-slate-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> {order.deliveryAddress}
        </p>
        <a href={`tel:${order.deliveryPhone}`} className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline">
          <Phone className="h-4 w-4" /> {order.deliveryPhone}
        </a>
        {order.notes && (
          <p className="flex items-start gap-1.5 text-amber-800">
            <StickyNote className="mt-0.5 h-4 w-4 shrink-0" /> {order.notes}
          </p>
        )}
      </div>

      <ul className="mt-4 divide-y divide-slate-100 text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3 py-2">
            <span className="text-slate-700">
              <span className="font-bold text-slate-900">{item.quantity} ×</span> {item.productName}{' '}
              <span className="text-xs text-slate-400">({item.unit})</span>
            </span>
            <span className="shrink-0 font-medium tabular-nums text-slate-900">{formatCurrency(item.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center justify-between border-t border-dashed border-slate-200 pt-3 text-sm">
        <span className="text-slate-500">{payment}</span>
        <span className="text-base font-bold text-slate-900">{formatCurrency(order.totalAmount)}</span>
      </div>

      {order.cancelReason && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">Cancelled: {order.cancelReason}</p>}

      {(forward.length > 0 || canCancel) && (
        <div className="mt-4 flex gap-2">
          {forward.map((next) => (
            <Button key={next} className="flex-1" loading={busy === `${order.id}:${next}`} disabled={!!busy} onClick={() => onAdvance(order, next)}>
              {ORDER_STATUS_META[next].action}
            </Button>
          ))}
          {canCancel && (
            <Button variant="danger-soft" icon={Ban} disabled={!!busy} onClick={() => onCancel(order)} aria-label="Cancel order">
              <span className="hidden sm:inline">Cancel</span>
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

export default function ShopkeeperOrders() {
  const toast = useToast();
  const [tab, setTab] = useState('new');
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [reason, setReason] = useState('');
  const [cancelBusy, setCancelBusy] = useState(false);

  const statuses = TABS.find((t) => t.key === tab).statuses;

  useEffect(() => setPage(0), [tab]);

  const { data, loading, error, reload, setData } = useAsync(
    () => shopkeeperApi.orders({ status: statuses.length ? statuses : undefined, page, size: 12 }),
    [tab, page],
  );

  useInterval(reload, 20000);

  const applyUpdate = (updated) => {
    setData((d) => {
      if (!d) return d;
      const stillVisible = statuses.length === 0 || statuses.includes(updated.status);
      return {
        ...d,
        content: stillVisible
          ? d.content.map((o) => (o.id === updated.id ? updated : o))
          : d.content.filter((o) => o.id !== updated.id),
      };
    });
  };

  const advance = async (order, status) => {
    setBusy(`${order.id}:${status}`);
    try {
      const { data: updated } = await shopkeeperApi.updateOrderStatus(order.id, { status });
      applyUpdate(updated);
      toast.success(`${order.orderNumber} marked ${ORDER_STATUS_META[status].label.toLowerCase()}`);
    } catch (err) {
      toast.error(errorMessage(err));
      reload();
    } finally {
      setBusy(null);
    }
  };

  const submitCancel = async () => {
    if (!reason.trim()) {
      toast.error('Please give the customer a reason');
      return;
    }
    setCancelBusy(true);
    try {
      const { data: updated } = await shopkeeperApi.updateOrderStatus(cancelling.id, { status: 'CANCELLED', note: reason.trim() });
      applyUpdate(updated);
      toast.success(`${cancelling.orderNumber} cancelled and stock restored`);
      setCancelling(null);
      setReason('');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setCancelBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Move orders through the pipeline. This list refreshes every 20 seconds."
        actions={
          <Button variant="secondary" icon={RefreshCw} onClick={reload} loading={loading && !!data}>
            Refresh
          </Button>
        }
      />

      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} className={`chip ${tab === t.key ? 'chip-active' : 'chip-idle'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : data.content.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No orders here" description="Orders in this stage will show up automatically." />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.content.map((order) => (
              <OrderCard key={order.id} order={order} busy={busy} onAdvance={advance} onCancel={setCancelling} />
            ))}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      <Modal
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        title={`Cancel ${cancelling?.orderNumber || ''}`}
        description="The customer will see this reason. Reserved stock goes back to your inventory."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelling(null)}>
              Keep order
            </Button>
            <Button variant="danger" loading={cancelBusy} onClick={submitCancel}>
              Cancel order
            </Button>
          </>
        }
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {CANCEL_REASONS.map((r) => (
            <button key={r} type="button" onClick={() => setReason(r)} className={`chip text-xs ${reason === r ? 'chip-active' : 'chip-idle'}`}>
              {r}
            </button>
          ))}
        </div>
        <TextArea label="Reason" name="reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} required />
      </Modal>
    </>
  );
}
