import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, MapPin, Plus, ShieldCheck, Wallet } from 'lucide-react';
import { customerApi } from '../../api/customerApi.js';
import { errorMessage } from '../../api/axiosClient.js';
import useAsync from '../../hooks/useAsync.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/common/Button.jsx';
import { TextArea, TextInput } from '../../components/common/Fields.jsx';
import { PageHeader } from '../../components/common/Feedback.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import AddressFormModal from '../../components/customer/AddressFormModal.jsx';
import { OrderSummary, useCartValidation } from './Cart.jsx';
import { PAYMENT_METHODS, isOnlinePayment } from '../../utils/constants.js';
import { formatCurrency } from '../../utils/format.js';
import useRazorpayPayment from '../../hooks/useRazorpayPayment.js';

function Step({ number, title, icon: Icon, children }) {
  return (
    <section className="card p-5">
      <h2 className="mb-4 flex items-center gap-2.5 text-base font-semibold text-slate-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{number}</span>
        {title}
        {Icon && <Icon className="ml-auto h-5 w-5 text-slate-300" />}
      </h2>
      {children}
    </section>
  );
}

export default function Checkout() {
  const { user } = useAuth();
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const { result, loading: validating, error: validationError } = useCartValidation(true);
  const { pay } = useRazorpayPayment();

  const addresses = useAsync(() => customerApi.addresses(), []);
  const [addressId, setAddressId] = useState(null);
  const [addressModal, setAddressModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [phone, setPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState('');

  useEffect(() => {
    if (addressId === null && addresses.data?.length) {
      setAddressId((addresses.data.find((a) => a.isDefault) || addresses.data[0]).id);
    }
  }, [addresses.data, addressId]);

  if (cart.items.length === 0 && !placing) return <Navigate to="/cart" replace />;

  const phoneValid = /^[6-9][0-9]{9}$/.test(phone);
  const ready = result?.valid && addressId && phoneValid && !validating;

  const online = isOnlinePayment(paymentMethod);

  const placeOrder = async () => {
    setPlaceError('');
    setPlacing(true);
    let data;
    try {
      ({ data } = await customerApi.placeOrder({
        shopId: cart.shop.id,
        addressId,
        items: cart.items.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        paymentMethod,
        contactPhone: phone,
        notes: notes.trim() || null,
      }));
    } catch (err) {
      setPlaceError(errorMessage(err, 'Could not place your order'));
      setPlacing(false);
      return;
    }

    // The order now exists (stock reserved), so the basket is done either way.
    cart.clearCart();
    if (!online) {
      toast.success('Order placed! The shop has been notified.');
      navigate(`/orders/${data.id}`, { replace: true });
      return;
    }

    const result = await pay(data.id, paymentMethod);
    if (result.outcome === 'paid') {
      toast.success('Payment received! Your order has been sent to the shop.');
    } else {
      toast.error(`${result.message || 'Payment was not completed.'} You can retry from the order page.`);
    }
    navigate(`/orders/${data.id}`, { replace: true });
  };

  return (
    <>
      <PageHeader
        back={
          <Link to="/cart" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" /> Back to basket
          </Link>
        }
        title="Checkout"
        subtitle={`Ordering from ${cart.shop?.name}`}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Step number={1} title="Delivery address" icon={MapPin}>
            {addresses.loading && !addresses.data ? (
              <Spinner />
            ) : (
              <div className="space-y-2.5">
                {(addresses.data || []).map((a) => (
                  <label
                    key={a.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                      addressId === a.id ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/15' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input type="radio" name="address" className="mt-1 accent-brand-600" checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
                    <span className="text-sm">
                      <span className="font-semibold text-slate-900">
                        {a.label}
                        {a.isDefault && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-500">Default</span>}
                      </span>
                      <span className="block text-slate-600">{a.fullText}</span>
                    </span>
                  </label>
                ))}
                <Button variant="soft" icon={Plus} onClick={() => setAddressModal(true)}>
                  Add new address
                </Button>
              </div>
            )}
          </Step>

          <Step number={2} title="Contact & instructions">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Phone for the rider"
                name="contactPhone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                error={phone && !phoneValid ? 'Enter a valid 10-digit mobile number' : undefined}
                required
              />
              <TextArea
                label="Notes for the shop (optional)"
                name="notes"
                rows={2}
                maxLength={300}
                placeholder="e.g. Ring the bell, ripe bananas please"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </Step>

          <Step number={3} title="Payment" icon={Wallet}>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.value}
                  className={`flex cursor-pointer flex-col rounded-xl border p-3.5 transition ${
                    paymentMethod === m.value ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/15' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <input type="radio" name="payment" className="accent-brand-600" checked={paymentMethod === m.value} onChange={() => setPaymentMethod(m.value)} />
                    {m.label}
                  </span>
                  <span className="mt-1 pl-6 text-xs text-slate-500">{m.hint}</span>
                </label>
              ))}
            </div>
            {online && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                You’ll pay securely on Razorpay right after placing the order. The shop receives your order once
                the payment succeeds.
              </p>
            )}
          </Step>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <OrderSummary
            subtotal={result?.subtotal ?? cart.subtotal}
            deliveryFee={result?.deliveryFee ?? cart.shop?.deliveryFee}
            total={result?.total ?? cart.subtotal + (cart.shop?.deliveryFee || 0)}
            minOrderAmount={result?.minOrderAmount ?? cart.shop?.minOrderAmount}
          >
            <ul className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
              {cart.items.map((l) => (
                <li key={l.product.id} className="flex justify-between gap-2">
                  <span className="truncate">
                    {l.quantity} × {l.product.name}
                  </span>
                  {result?.lines.find((x) => x.productId === l.product.id)?.ok === false && (
                    <span className="shrink-0 font-semibold text-rose-600">Unavailable</span>
                  )}
                </li>
              ))}
            </ul>

            {(placeError || validationError || (result && !result.valid)) && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {placeError || validationError || result.messages[0] || 'Some items need attention.'}{' '}
                  <Link to="/cart" className="underline">
                    Review basket
                  </Link>
                </span>
              </div>
            )}

            <Button size="lg" className="mt-5 w-full" icon={online ? ShieldCheck : CheckCircle2} loading={placing} disabled={!ready} onClick={placeOrder}>
              {online && result?.total != null ? `Place order & pay ${formatCurrency(result.total)}` : 'Place order'}
            </Button>
            {!addressId && addresses.data && <p className="mt-2 text-center text-xs text-slate-500">Add a delivery address to continue.</p>}
          </OrderSummary>
        </aside>
      </div>

      <AddressFormModal
        open={addressModal}
        onClose={() => setAddressModal(false)}
        address={null}
        onSaved={(saved) => {
          setAddressModal(false);
          setAddressId(saved.id);
          addresses.reload();
        }}
      />
    </>
  );
}
