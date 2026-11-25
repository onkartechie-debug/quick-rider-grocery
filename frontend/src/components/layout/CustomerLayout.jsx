import { Link, NavLink, Outlet } from 'react-router-dom';
import { Home, LogIn, Receipt, ShoppingCart, User } from 'lucide-react';
import Logo from '../common/Logo.jsx';
import BottomNav from './BottomNav.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { formatCurrency, initials } from '../../utils/format.js';

export default function CustomerLayout() {
  const { user } = useAuth();
  const { count, subtotal } = useCart();

  const mobileNav = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/orders', label: 'Orders', icon: Receipt },
    { to: '/cart', label: 'Cart', icon: ShoppingCart, badge: count },
    user ? { to: '/account', label: 'Account', icon: User } : { to: '/login', label: 'Login', icon: LogIn },
  ];

  const desktopLink = ({ isActive }) =>
    `rounded-xl px-3 py-2 text-sm font-semibold transition ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <div className="min-h-screen bg-surface">
      <header className="glass sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" end className={desktopLink}>
              Shops
            </NavLink>
            {user && (
              <NavLink to="/orders" className={desktopLink}>
                My orders
              </NavLink>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/cart"
              className="relative hidden h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700 md:inline-flex"
            >
              <ShoppingCart className="h-4 w-4" />
              {count > 0 ? (
                <span>
                  {count} item{count > 1 ? 's' : ''} · {formatCurrency(subtotal)}
                </span>
              ) : (
                <span>Cart</span>
              )}
            </Link>
            {user ? (
              <Link
                to="/account"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-800 text-sm font-bold text-white transition hover:ring-4 hover:ring-brand-500/20"
                aria-label="My account"
              >
                {initials(user.fullName)}
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-5 sm:px-6 md:pb-12">
        <Outlet />
      </main>

      <BottomNav items={mobileNav} />
    </div>
  );
}
