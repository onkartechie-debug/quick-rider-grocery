import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_HOME } from '../utils/constants.js';
import { PageLoader } from '../components/common/Spinner.jsx';

/**
 * Guards a route tree by role. Anonymous users go to /login (and come back afterwards);
 * users of another role are sent to their own portal, so roles can never cross over.
 */
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] || '/'} replace />;
  }

  return children ?? <Outlet />;
}

/** Login/register pages: signed-in users are sent straight to their portal. */
export function GuestOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to={ROLE_HOME[user.role] || '/'} replace />;
  return children ?? <Outlet />;
}

/** Storefront: open to guests and customers; admins and shopkeepers are redirected to their portals. */
export function CustomerAreaRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user && user.role !== 'CUSTOMER') return <Navigate to={ROLE_HOME[user.role]} replace />;
  return children ?? <Outlet />;
}
