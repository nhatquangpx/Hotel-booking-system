/**
 * Đồng bộ phiên đăng nhập giữa Redux, redux-persist và localStorage (token/user).
 */

export const clearAuthSessionStorage = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
