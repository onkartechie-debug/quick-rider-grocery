import { LayoutDashboard, PlusCircle, Store } from 'lucide-react';
import DashboardLayout from './DashboardLayout.jsx';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/shops', label: 'Shops', icon: Store, end: true },
  { to: '/admin/shops/new', label: 'Onboard', icon: PlusCircle, end: true },
];

export default function AdminLayout() {
  return <DashboardLayout navItems={NAV} portalLabel="Admin console" homePath="/admin" />;
}
