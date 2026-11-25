import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Logo from '../common/Logo.jsx';
import BottomNav from './BottomNav.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { initials } from '../../utils/format.js';
import { ROLE_LABEL } from '../../utils/constants.js';

/** Shared shell for the Admin and Shopkeeper portals: sidebar on desktop, bottom tabs on mobile. */
export default function DashboardLayout({ navItems, portalLabel, homePath }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center border-b border-slate-100 px-5">
          <Logo to={homePath} />
        </div>
        <p className="px-6 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{portalLabel}</p>
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-800 text-sm font-bold text-white">
              {initials(user?.fullName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{user?.fullName}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="glass sticky top-0 z-20 flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="md:hidden">
            <Logo to={homePath} />
          </div>
          <p className="hidden text-sm text-slate-500 md:block">
            Welcome back, <span className="font-semibold text-slate-900">{user?.fullName?.split(' ')[0]}</span>
          </p>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-forest-800 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              {ROLE_LABEL[user?.role]}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 md:hidden"
              aria-label="Log out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-10">
          <Outlet />
        </main>
      </div>

      <BottomNav items={navItems} />
    </div>
  );
}
