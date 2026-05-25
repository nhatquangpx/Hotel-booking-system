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
  const auth = useSelector((state) => state.user) || { user: null, token: null };
  const { user, token } = auth;

  const localToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  let localUser = null;
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed._id || parsed.id || parsed.email)) {
          localUser = parsed;
        }
      } catch {
        localUser = null;
      }
    }
  }

  // Redux đã xóa phiên (đăng xuất) — không dùng token/user còn sót trong localStorage
  const isReduxSessionEmpty = !token && !user;

  const effectiveToken = isReduxSessionEmpty ? null : (token || localToken);
  const effectiveUser = isReduxSessionEmpty ? null : (user || localUser);

  return {
    user: effectiveUser,
    token: effectiveToken,
    isAuthenticated: !!(effectiveToken && effectiveUser),
    role: effectiveUser?.role,
  };
};

