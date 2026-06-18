/**
 * Điều hướng sau đăng nhập.
 *
 * `resolvePostLoginNavigation` ưu tiên:
 * 1. `routerState.from` — Location đầy đủ hoặc path string (chuẩn hiện tại)
 * 2. `routerState.redirectUrl` (+ `redirectState`) — legacy, vẫn hỗ trợ tương thích
 * 3. Trang mặc định theo `user.role` (`ROLE_HOME_ROUTES`)
 *
 * `buildLoginState` chỉ ghi `from` khi chuyển tới `/login`.
 */
import { ROLE_HOME_ROUTES } from '@/constants/routes';

const isSafeInternalPath = (path) =>
  typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');

const getDefaultPathForRole = (role) => ({
  pathname: ROLE_HOME_ROUTES[role] || ROLE_HOME_ROUTES.guest,
});

const normalizeFrom = (from) => {
  if (!from) return null;

  if (typeof from === 'string') {
    if (!isSafeInternalPath(from)) return null;
    return { pathname: from, search: '', hash: '', state: undefined };
  }

  if (typeof from === 'object' && isSafeInternalPath(from.pathname)) {
    return {
      pathname: from.pathname,
      search: from.search || '',
      hash: from.hash || '',
      state: from.state,
    };
  }

  return null;
};

/** @param {object} user — user sau login */
/** @param {object} [routerState] — `location.state` từ trang /login */
export const resolvePostLoginNavigation = (user, routerState) => {
  const fromTarget = normalizeFrom(routerState?.from);
  if (fromTarget) return fromTarget;

  const redirectUrl = routerState?.redirectUrl;
  if (redirectUrl && isSafeInternalPath(redirectUrl)) {
    return {
      pathname: redirectUrl,
      search: '',
      hash: '',
      state: routerState?.redirectState,
    };
  }

  return getDefaultPathForRole(user?.role);
};

/** State truyền khi `navigate(ROUTES.LOGIN, { state: buildLoginState(from) })` */
export const buildLoginState = (from) => {
  if (!from) return undefined;
  if (typeof from === 'string') {
    return isSafeInternalPath(from) ? { from } : undefined;
  }
  if (from.pathname) {
    return { from };
  }
  return undefined;
};
