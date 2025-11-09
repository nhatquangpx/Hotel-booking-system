import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../shared/hooks";

/**
 * ProtectedRoute Component
 * Protects routes based on authentication and role
 * 
 * @param {string[]} allowedRoles - Array of allowed roles (e.g., ["admin", "owner"])
 * @param {boolean} require2FA - Whether 2FA is required (future feature)
 * 
 * Future enhancements:
 * - 2FA verification check
 * - Permission-based access
 */
const ProtectedRoute = ({ allowedRoles, require2FA = false }) => {
  const { user, token, isAuthenticated, role } = useAuth();

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role check
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
