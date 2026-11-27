import {
  Apple,
  Ban,
  Bike,
  CheckCircle2,
  Cookie,
  CreditCard,
  CupSoda,
  Milk,
  PackageCheck,
  Receipt,
  ShoppingBasket,
  SprayCan,
  ThumbsUp,
  Wheat,
} from 'lucide-react';

export const ROLE_HOME = {
  ADMIN: '/admin',
  SHOPKEEPER: '/shopkeeper',
  CUSTOMER: '/',
};

export const ROLE_LABEL = {
  ADMIN: 'Admin',
  SHOPKEEPER: 'Shopkeeper',
  CUSTOMER: 'Customer',
};

export const ORDER_PIPELINE = ['PLACED', 'ACCEPTED', 'PACKING', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export const ORDER_STATUS_META = {
  AWAITING_PAYMENT: {
    label: 'Awaiting payment',
    badge: 'bg-orange-50 text-orange-700 ring-orange-600/20',
    icon: CreditCard,
    action: 'Pay now',
    customerText: 'Complete your payment to send this order to the shop',
  },
  PLACED: {
    label: 'Placed',
    badge: 'bg-sky-50 text-sky-700 ring-sky-600/20',
    icon: Receipt,
    action: 'Accept order',
    customerText: 'Waiting for the shop to accept your order',
  },
  ACCEPTED: {
    label: 'Accepted',
    badge: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    icon: ThumbsUp,
    action: 'Accept order',
    customerText: 'The shop has accepted your order',
  },
  PACKING: {
    label: 'Packing',
    badge: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    icon: PackageCheck,
    action: 'Start packing',
    customerText: 'Your items are being packed',
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for delivery',
    badge: 'bg-violet-50 text-violet-700 ring-violet-600/20',
    icon: Bike,
    action: 'Send out for delivery',
    customerText: 'Your rider is on the way',
  },
  DELIVERED: {
    label: 'Delivered',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    icon: CheckCircle2,
    action: 'Mark delivered',
    customerText: 'Delivered. Enjoy your groceries!',
  },
  CANCELLED: {
    label: 'Cancelled',
    badge: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    icon: Ban,
    action: 'Cancel order',
    customerText: 'This order was cancelled',
  },
};

export const ACTIVE_STATUSES = ['AWAITING_PAYMENT', 'PLACED', 'ACCEPTED', 'PACKING', 'OUT_FOR_DELIVERY'];

export const PAYMENT_METHODS = [
  { value: 'COD', label: 'Cash on delivery', hint: 'Pay the rider in cash', online: false },
  { value: 'UPI', label: 'UPI', hint: 'Pay now with any UPI app (Razorpay)', online: true },
  { value: 'CARD', label: 'Card / Netbanking', hint: 'Pay now securely via Razorpay', online: true },
];

export const isOnlinePayment = (method) => PAYMENT_METHODS.find((m) => m.value === method)?.online === true;

export const PAYMENT_STATUS_META = {
  PENDING: { label: 'Payment pending', className: 'bg-slate-100 text-slate-600' },
  PAID: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700' },
  FAILED: { label: 'Payment failed', className: 'bg-rose-50 text-rose-700' },
  REFUND_PENDING: { label: 'Refund pending', className: 'bg-amber-50 text-amber-700' },
};

export const CATEGORY_ICONS = {
  Apple,
  Milk,
  Wheat,
  CupSoda,
  Cookie,
  SprayCan,
};

export function categoryIcon(name) {
  return CATEGORY_ICONS[name] || ShoppingBasket;
}

export const MAX_QTY_PER_ITEM = 50;
export const LOW_STOCK_THRESHOLD = 10;
export const PINCODE_STORAGE_KEY = 'quickrider.pincode';
