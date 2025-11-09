/**
 * useAuth Hook
 * Shared authentication hook
 * 
 * Future enhancements:
 * - 2FA support
 * - Session management
 * - Token refresh
 */
import { useSelector } from 'react-redux';

export const useAuth = () => {
  const auth = useSelector((state) => state.auth) || { user: null, token: null };
  const { user, token } = auth;

  const localToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const localUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};

  const effectiveToken = token || localToken;
  const effectiveUser = user || localUser;

  return {
    user: effectiveUser,
    token: effectiveToken,
    isAuthenticated: !!effectiveToken,
    role: effectiveUser?.role,
  };
};

