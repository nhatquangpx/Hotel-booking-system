import axios from 'axios';
import { toast } from 'react-toastify';
import store from '@/store';
import { setLogin, setLogout } from '@/store/slices/userSlice';
import { clearCccdReminderDismissals } from '@/shared/utils/auth/cccdReminder';

const logoutClient = () => {
  clearCccdReminderDismissals();
  store.dispatch(setLogout());
};

const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const url = (envUrl || `http://localhost:8001/api`).trim();

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'http://localhost:8001/api';
  }

  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const normalizedApiUrl = getApiUrl();

const api = axios.create({
  baseURL: normalizedApiUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getCsrfTokenFromCookie = () => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken) {
      config.headers = config.headers || {};
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }
  return config;
});

const AUTH_SKIP_REFRESH = [
  '/auth/login',
  '/auth/register',
  '/auth/verify-2fa',
  '/auth/resend-2fa-otp',
  '/auth/refresh',
  '/auth/logout',
  '/auth/forgotpassword',
];

const shouldSkipRefresh = (url = '') =>
  AUTH_SKIP_REFRESH.some((path) => url.includes(path));

let isRefreshing = false;
let refreshWaitQueue = [];

const processRefreshQueue = (error) => {
  refreshWaitQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  refreshWaitQueue = [];
};

const refreshSession = async () => {
  const response = await api.post('/auth/refresh');
  if (response.data?.user) {
    store.dispatch(setLogin({ user: response.data.user }));
  }
};

const showForbiddenMessage = (error) => {
  const status = error?.response?.status;
  if (status !== 403 || typeof window === 'undefined') return;

  const data = error.response.data;
  const message =
    data?.message ||
    (typeof data === 'string' ? data : null);

  if (message) {
    const toastId = data?.code === 'WRONG_ROLE'
      ? `wrong-role-${data.currentRole}-${data.requiredRole}`
      : `forbidden-${message}`;
    toast.error(message, { toastId });
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 403) {
      showForbiddenMessage(error);
      return Promise.reject(error);
    }

    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    if (!originalRequest || shouldSkipRefresh(originalRequest.url)) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      logoutClient();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshWaitQueue.push({ resolve, reject });
      }).then(() => api(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await refreshSession();
      processRefreshQueue(null);
      return api(originalRequest);
    } catch (refreshError) {
      processRefreshQueue(refreshError);
      logoutClient();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export const handleApiError = (error, defaultMessage) => {
  if (error.response) {
    const errorMsg =
      error.response.data?.message ||
      error.response.data?.error ||
      (error.response.data && typeof error.response.data === 'string'
        ? error.response.data
        : null) ||
      defaultMessage;

    throw new Error(errorMsg);
  }

  if (error.request) {
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
  }

  throw new Error(error.message || defaultMessage);
};

export default api;
