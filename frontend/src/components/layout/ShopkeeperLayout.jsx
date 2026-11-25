import { Boxes, ClipboardList, LayoutDashboard } from 'lucide-react';
import DashboardLayout from './DashboardLayout.jsx';

const NAV = [
  { to: '/shopkeeper', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/shopkeeper/orders', label: 'Orders', icon: ClipboardList, end: true },
  { to: '/shopkeeper/inventory', label: 'Inventory', icon: Boxes, end: true },
];

export default function ShopkeeperLayout() {
  return <DashboardLayout navItems={NAV} portalLabel="Shop manager" homePath="/shopkeeper" />;
}
