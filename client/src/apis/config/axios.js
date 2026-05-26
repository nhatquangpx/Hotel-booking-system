import axios from 'axios';
import store from '@/store';
import { setLogin, setLogout } from '@/store/slices/userSlice';

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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    if (!originalRequest || shouldSkipRefresh(originalRequest.url)) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      store.dispatch(setLogout());
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login')
      ) {
        window.location.href = '/login';
      }
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
      store.dispatch(setLogout());
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login')
      ) {
        window.location.href = '/login';
      }
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
