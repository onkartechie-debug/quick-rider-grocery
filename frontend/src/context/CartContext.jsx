import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ShoppingBasket } from 'lucide-react';
import Modal from '../components/common/Modal.jsx';
import Button from '../components/common/Button.jsx';
import { MAX_QTY_PER_ITEM } from '../utils/constants.js';

const CartContext = createContext(null);
const STORAGE_KEY = 'quickrider.cart.v1';
const EMPTY_CART = { shop: null, items: [] };

// The cart holds only public catalogue data (no credentials), so localStorage is fine here.
function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_CART;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) return EMPTY_CART;
    return parsed;
  } catch {
    return EMPTY_CART;
  }
}

const productSnapshot = (p) => ({
  id: p.id,
  name: p.name,
  unit: p.unit,
  price: Number(p.price),
  effectivePrice: Number(p.effectivePrice),
  imageUrl: p.imageUrl || null,
  stockQuantity: p.stockQuantity,
});

const shopSnapshot = (s) => ({
  id: s.id,
  name: s.name,
  deliveryFee: Number(s.deliveryFee || 0),
  minOrderAmount: Number(s.minOrderAmount || 0),
});

const maxFor = (product) => Math.max(0, Math.min(product.stockQuantity ?? MAX_QTY_PER_ITEM, MAX_QTY_PER_ITEM));

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);
  const [conflict, setConflict] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Storage may be unavailable (private mode); the cart still works in memory.
    }
  }, [cart]);

  useEffect(() => {
    const onLogout = () => setCart(EMPTY_CART);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  /** Adds one unit. Returns false and opens a prompt if the cart holds another shop's items. */
  const addItem = useCallback(
    (product, shop) => {
      if (cart.shop && cart.shop.id !== shop.id && cart.items.length > 0) {
        setConflict({ product, shop });
        return false;
      }
      setCart((current) => {
        const items = [...current.items];
        const index = items.findIndex((line) => line.product.id === product.id);
        if (index >= 0) {
          const next = Math.min(items[index].quantity + 1, maxFor(product));
          items[index] = { product: productSnapshot(product), quantity: next };
        } else if (maxFor(product) > 0) {
          items.push({ product: productSnapshot(product), quantity: 1 });
        }
        return { shop: shopSnapshot(shop), items };
      });
      return true;
    },
    [cart.shop, cart.items.length],
  );

  const setQuantity = useCallback((productId, quantity) => {
    setCart((current) => {
      const items = current.items
        .map((line) => {
          if (line.product.id !== productId) return line;
          const increasing = quantity > line.quantity;
          const capped = increasing ? Math.min(quantity, maxFor(line.product)) : quantity;
          return { ...line, quantity: Math.max(0, Math.min(capped, MAX_QTY_PER_ITEM)) };
        })
        .filter((line) => line.quantity > 0);
      return items.length ? { ...current, items } : EMPTY_CART;
    });
  }, []);

  const removeItem = useCallback((productId) => setQuantity(productId, 0), [setQuantity]);
  const clearCart = useCallback(() => setCart(EMPTY_CART), []);

  /** Refreshes stored stock/prices from a server-side cart validation. */
  const syncFromValidation = useCallback((lines) => {
    if (!Array.isArray(lines)) return;
    setCart((current) => {
      let changed = false;
      const items = current.items.map((line) => {
        const fresh = lines.find((l) => l.productId === line.product.id);
        if (!fresh || fresh.unitPrice === null || fresh.unitPrice === undefined) return line;
        const price = Number(fresh.unitPrice);
        if (price === line.product.effectivePrice && fresh.availableStock === line.product.stockQuantity) return line;
        changed = true;
        return { ...line, product: { ...line.product, effectivePrice: price, stockQuantity: fresh.availableStock } };
      });
      return changed ? { ...current, items } : current;
    });
  }, []);

  const confirmReplace = useCallback(() => {
    if (!conflict) return;
    const { product, shop } = conflict;
    setCart({ shop: shopSnapshot(shop), items: [{ product: productSnapshot(product), quantity: 1 }] });
    setConflict(null);
  }, [conflict]);

  const value = useMemo(() => {
    const count = cart.items.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = cart.items.reduce((sum, line) => sum + line.product.effectivePrice * line.quantity, 0);
    const quantityOf = (productId) => cart.items.find((line) => line.product.id === productId)?.quantity || 0;
    return {
      shop: cart.shop,
      items: cart.items,
      count,
      subtotal,
      quantityOf,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      syncFromValidation,
    };
  }, [cart, addItem, setQuantity, removeItem, clearCart, syncFromValidation]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <Modal
        open={!!conflict}
        onClose={() => setConflict(null)}
        title="Start a new basket?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConflict(null)}>
              Keep current basket
            </Button>
            <Button onClick={confirmReplace}>Clear &amp; add</Button>
          </>
        }
      >
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <ShoppingBasket className="h-6 w-6" />
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            Your basket has items from <span className="font-semibold text-slate-900">{cart.shop?.name}</span>. Orders
            are delivered by one shop at a time, so adding items from{' '}
            <span className="font-semibold text-slate-900">{conflict?.shop?.name}</span> will clear your current basket.
          </p>
        </div>
      </Modal>
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
