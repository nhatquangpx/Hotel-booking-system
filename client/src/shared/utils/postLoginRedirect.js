/**
 * Điều hướng sau đăng nhập — quay lại trang trước (pathname, search, state).
 * Hỗ trợ `state.from` (Location hoặc path string) và `state.redirectUrl` (legacy).
 */

const isSafeInternalPath = (path) =>
  typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');

const getDefaultPathForRole = (role) => {
  switch (role) {
    case 'admin':
      return { pathname: '/admin' };
    case 'owner':
      return { pathname: '/owner' };
    case 'staff':
      return { pathname: '/staff' };
    default:
      return { pathname: '/' };
  }
};

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

/**
 * @param {object} user — user sau login
 * @param {object} [routerState] — location.state từ trang /login
 * @returns {{ pathname: string, search?: string, hash?: string, state?: object }}
 */
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

/** State truyền khi navigate('/login', { state }) */
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
