/**
 * useAuth Hook — phiên đăng nhập qua HttpOnly cookie + Redux (user).
 */
import { useSelector } from 'react-redux';

export const useAuth = () => {
  const auth = useSelector((state) => state.user) || { user: null, sessionChecked: false };
  const { user, sessionChecked } = auth;

  return {
    user,
    sessionChecked,
    isAuthenticated: sessionChecked && !!user,
    isLoading: !sessionChecked,
    role: user?.role,
  };
};
