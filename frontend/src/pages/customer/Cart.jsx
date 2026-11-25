import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, LogIn, ShoppingBasket, Store, Trash2 } from 'lucide-react';
import { customerApi } from '../../api/customerApi.js';
import { errorMessage } from '../../api/axiosClient.js';
import useDebounce from '../../hooks/useDebounce.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import Button from '../../components/common/Button.jsx';
import QuantityStepper from '../../components/common/QuantityStepper.jsx';
import SmartImage from '../../components/common/SmartImage.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { EmptyState, PageHeader } from '../../components/common/Feedback.jsx';
import { formatCurrency } from '../../utils/format.js';
import { MAX_QTY_PER_ITEM } from '../../utils/constants.js';

/** Re-validates the basket on the server whenever it changes (debounced). Customers only. */
export function useCartValidation(enabled) {
  const cart = useCart();
  const { syncFromValidation } = cart;
  const signature = useDebounce(JSON.stringify([cart.shop?.id, cart.items.map((l) => [l.product.id, l.quantity])]), 400);
  const [state, setState] = useState({ result: null, loading: false, error: '' });

  useEffect(() => {
    const [shopId, lines] = JSON.parse(signature);
    if (!enabled || !shopId || lines.length === 0) {
      setState({ result: null, loading: false, error: '' });
      return undefined;
    }
    let active = true;
    setState((s) => ({ ...s, loading: true, error: '' }));
    customerApi
      .validateCart({ shopId, items: lines.map(([productId, quantity]) => ({ productId, quantity })) })
      .then(({ data }) => {
        if (!active) return;
        setState({ result: data, loading: false, error: '' });
        syncFromValidation(data.lines);
      })
      .catch((err) => active && setState({ result: null, loading: false, error: errorMessage(err) }));
    return () => {
      active = false;
    };
  }, [signature, enabled, syncFromValidation]);

  return state;
}

export function OrderSummary({ subtotal, deliveryFee, total, minOrderAmount, children }) {
  return (
    <div className="card p-5">
      <h2 className="text-base font-semibold text-slate-900">Bill details</h2>
      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex justify-between text-slate-600">
          <dt>Item total</dt>
          <dd className="tabular-nums">{formatCurrency(subtotal)}</dd>
        </div>
        <div className="flex justify-between text-slate-600">
          <dt>Delivery fee</dt>
          <dd className="tabular-nums">{Number(deliveryFee) > 0 ? formatCurrency(deliveryFee) : 'Free'}</dd>
        </div>
        <div className="flex justify-between border-t border-dashed border-slate-200 pt-3 text-base font-bold text-slate-900">
          <dt>To pay</dt>
          <dd className="tabular-nums">{formatCurrency(total)}</dd>
        </div>
      </dl>
      {Number(minOrderAmount) > 0 && Number(subtotal) < Number(minOrderAmount) && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          Add {formatCurrency(Number(minOrderAmount) - Number(subtotal))} more to reach the {formatCurrency(minOrderAmount)} minimum.
        </p>
      )}
      {children}
    </div>
  );
}

export default function Cart() {
  const { user } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const isCustomer = user?.role === 'CUSTOMER';
  const { result, loading, error } = useCartValidation(isCustomer);

  if (cart.items.length === 0) {
    return (
      <>
        <PageHeader title="Your basket" />
        <EmptyState
          icon={ShoppingBasket}
          title="Your basket is empty"
          description="Explore shops near you and add fresh groceries to get started."
          action={
            <Link to="/">
              <Button icon={Store}>Browse shops</Button>
            </Link>
          }
        />
      </>
    );
  }

  const lineStatus = (productId) => result?.lines.find((l) => l.productId === productId);
  const subtotal = result ? result.subtotal : cart.subtotal;
  const deliveryFee = result ? result.deliveryFee : cart.shop.deliveryFee;
  const total = result ? result.total : cart.subtotal + cart.shop.deliveryFee;
  const canCheckout = isCustomer && result?.valid && !loading;

  return (
    <>
      <PageHeader
        title="Your basket"
        subtitle={
          <>
            Delivered by{' '}
            <Link to={`/shops/${cart.shop.id}`} className="font-semibold text-brand-700 hover:underline">
              {cart.shop.name}
            </Link>
          </>
        }
        actions={
          <Button variant="ghost" size="sm" icon={Trash2} onClick={cart.clearCart}>
            Clear basket
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="space-y-3 lg:col-span-2">
          {result?.messages?.map((msg) => (
            <p key={msg} className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {msg}
            </p>
          ))}
          {error && (
            <p className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </p>
          )}

          <ul className="card divide-y divide-slate-100">
            {cart.items.map(({ product, quantity }) => {
              const status = lineStatus(product.id);
              const max = Math.min(product.stockQuantity, MAX_QTY_PER_ITEM);
              return (
                <li key={product.id} className="flex gap-3 p-4">
                  <SmartImage src={product.imageUrl} alt={product.name} className="h-16 w-16 shrink-0 rounded-xl" iconClassName="h-5 w-5" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.unit}</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {formatCurrency(product.effectivePrice * quantity)}
                      {product.price > product.effectivePrice && (
                        <span className="ml-1.5 text-xs font-normal text-slate-400 line-through">{formatCurrency(product.price * quantity)}</span>
                      )}
                    </p>
                    {status && !status.ok && <p className="mt-1 text-xs font-semibold text-rose-600">{status.message}</p>}
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <QuantityStepper
                      size="sm"
                      value={quantity}
                      max={max}
                      onIncrement={() => cart.setQuantity(product.id, quantity + 1)}
                      onDecrement={() => cart.setQuantity(product.id, quantity - 1)}
                    />
                    <button type="button" onClick={() => cart.removeItem(product.id)} className="text-xs font-medium text-slate-400 hover:text-rose-600">
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary subtotal={subtotal} deliveryFee={deliveryFee} total={total} minOrderAmount={result?.minOrderAmount ?? cart.shop.minOrderAmount}>
            <div className="mt-5">
              {isCustomer ? (
                <Button size="lg" className="w-full" iconRight={ArrowRight} disabled={!canCheckout} onClick={() => navigate('/checkout')}>
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner className="h-4 w-4 text-white" /> Checking stock
                    </span>
                  ) : (
                    'Proceed to checkout'
                  )}
                </Button>
              ) : (
                <Link to="/login" state={{ from: '/cart' }}>
                  <Button size="lg" className="w-full" icon={LogIn}>
                    Login to checkout
                  </Button>
                </Link>
              )}
              <p className="mt-3 text-center text-xs text-slate-500">Prices and stock are confirmed again when you place the order.</p>
            </div>
          </OrderSummary>
        </aside>
      </div>
    </>
  );
}
