import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../shared/hooks";

/**
 * ProtectedRoute Component
 * Protects routes based on authentication and role
 */
const ProtectedRoute = ({ allowedRoles, require2FA = false }) => {
  const location = useLocation();
  const { user, isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Đang xác thực...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }
  }

  // Future: Check 2FA requirement
  // if (require2FA && !user.twoFactorVerified) {
  //   return <Navigate to="/verify-2fa" replace />;
  // }

  return <Outlet />;
};

export default ProtectedRoute;
