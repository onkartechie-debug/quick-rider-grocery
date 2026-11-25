import { Route, Routes } from 'react-router-dom';
import ProtectedRoute, { CustomerAreaRoute, GuestOnlyRoute } from './ProtectedRoute.jsx';
import AdminLayout from '../components/layout/AdminLayout.jsx';
import ShopkeeperLayout from '../components/layout/ShopkeeperLayout.jsx';
import CustomerLayout from '../components/layout/CustomerLayout.jsx';
import Login from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import AdminShops from '../pages/admin/AdminShops.jsx';
import AdminShopForm from '../pages/admin/AdminShopForm.jsx';
import ShopkeeperDashboard from '../pages/shopkeeper/ShopkeeperDashboard.jsx';
import Inventory from '../pages/shopkeeper/Inventory.jsx';
import ShopkeeperOrders from '../pages/shopkeeper/ShopkeeperOrders.jsx';
import Home from '../pages/customer/Home.jsx';
import ShopDetail from '../pages/customer/ShopDetail.jsx';
import Cart from '../pages/customer/Cart.jsx';
import Checkout from '../pages/customer/Checkout.jsx';
import Orders from '../pages/customer/Orders.jsx';
import OrderTracking from '../pages/customer/OrderTracking.jsx';
import Account from '../pages/customer/Account.jsx';
import NotFound from '../pages/NotFound.jsx';

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<GuestOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="shops" element={<AdminShops />} />
        <Route path="shops/new" element={<AdminShopForm />} />
        <Route path="shops/:shopId/edit" element={<AdminShopForm />} />
      </Route>

      <Route
        path="/shopkeeper"
        element={
          <ProtectedRoute roles={['SHOPKEEPER']}>
            <ShopkeeperLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ShopkeeperDashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="orders" element={<ShopkeeperOrders />} />
      </Route>

      <Route
        path="/"
        element={
          <CustomerAreaRoute>
            <CustomerLayout />
          </CustomerAreaRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="shops/:shopId" element={<ShopDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route element={<ProtectedRoute roles={['CUSTOMER']} />}>
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:orderId" element={<OrderTracking />} />
          <Route path="account" element={<Account />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
