import axios from 'axios';

/**
 * Single Axios instance for the whole app.
 * - withCredentials: the HttpOnly QR_ACCESS cookie is sent automatically; JS never sees the JWT.
 * - CSRF: Spring writes a readable XSRF-TOKEN cookie; we echo it in X-XSRF-TOKEN on unsafe methods.
 * - paramsSerializer: repeated keys (status=A&status=B) so Spring binds List<> params.
 */
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 15000,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
  paramsSerializer: { indexes: null },
});

const SAFE_METHODS = ['get', 'head', 'options'];

export function readCookie(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (!SAFE_METHODS.includes(method)) {
    const token = readCookie('XSRF-TOKEN');
    if (token) {
      config.headers['X-XSRF-TOKEN'] = token;
    }
  }
  return config;
});

let csrfInFlight = null;

/** Makes sure the XSRF-TOKEN cookie exists. Pass force=true to fetch a fresh one. */
export function ensureCsrf(force = false) {
  if (!force && readCookie('XSRF-TOKEN')) {
    return Promise.resolve();
  }
  if (!csrfInFlight) {
    csrfInFlight = api.get('/auth/csrf').finally(() => {
      csrfInFlight = null;
    });
  }
  return csrfInFlight;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    if (!response || !config) {
      return Promise.reject(error);
    }

    // CSRF cookie missing/expired: fetch a fresh token and retry the request once.
    const isCsrfFailure = response.status === 403 && /csrf/i.test(response.data?.message || '');
    if (isCsrfFailure && !config.__csrfRetried) {
      config.__csrfRetried = true;
      await ensureCsrf(true);
      return api(config);
    }

    // Session expired anywhere outside the auth endpoints: let AuthContext reset the user.
    if (response.status === 401 && !String(config.url || '').startsWith('/auth/')) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  },
);

/** Human-readable message from an API error (ApiError shape from the backend). */
export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error?.response) {
    return error?.code === 'ECONNABORTED'
      ? 'The request timed out. Please try again.'
      : 'Cannot reach the server. Check your connection.';
  }
  const data = error.response.data;
  if (data?.fieldErrors && Object.keys(data.fieldErrors).length > 0 && data.message === 'Validation failed') {
    return Object.values(data.fieldErrors)[0];
  }
  return data?.message || fallback;
}

/** Field-level validation errors keyed by field path (e.g. "shop.name"). */
export function fieldErrors(error) {
  return error?.response?.data?.fieldErrors || {};
}

export default api;
