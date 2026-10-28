import {
  clearAuthSession,
  getActiveCompany,
  getAuthSession,
  saveAuthSession,
} from './sessionStore';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
let refreshInFlight = null;

export class ApiError extends Error {
  constructor(message, status = 500, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

async function readResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const current = getAuthSession();
    if (!current?.refreshToken) throw new ApiError('La sesión expiró. Inicia sesión nuevamente.', 401);

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    });
    const payload = await readResponse(response);

    if (!response.ok || payload?.success === false || !payload?.data?.accessToken) {
      throw new ApiError(payload?.message || 'No fue posible renovar la sesión.', response.status || 401, payload);
    }

    saveAuthSession({
      ...current,
      accessToken: payload.data.accessToken,
      refreshToken: payload.data.refreshToken || current.refreshToken,
    });
  })();

  try {
    await refreshInFlight;
  } catch (error) {
    clearAuthSession();
    throw error;
  } finally {
    refreshInFlight = null;
  }
}

/**
 * Cliente común para la API.
 * Opciones extra:
 *   auth: false       no adjunta Bearer token ni intenta refresh.
 *   company: false    no adjunta X-Empresa-Id.
 *   retryAuth: false  no intenta repetir una solicitud tras un 401.
 */
async function performApiRequest(path, options = {}) {
  const {
    auth = true,
    company = true,
    retryAuth = true,
    headers: suppliedHeaders,
    ...fetchOptions
  } = options;

  const makeRequest = async () => {
    const headers = new Headers(suppliedHeaders || {});
    const isFormData = typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;

    if (fetchOptions.body != null && !isFormData && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const session = getAuthSession();
    if (auth && session?.accessToken) {
      headers.set('Authorization', `Bearer ${session.accessToken}`);
    }

    const activeCompany = company ? getActiveCompany() : null;
    if (activeCompany?.id != null && !headers.has('X-Empresa-Id')) {
      headers.set('X-Empresa-Id', String(activeCompany.id));
    }

    return fetch(`${API_BASE_URL}${path}`, { ...fetchOptions, headers });
  };

  let response = await makeRequest();
  if (response.status === 401 && auth && retryAuth && path !== '/auth/refresh') {
    try {
      await refreshAccessToken();
      response = await makeRequest(); // una sola repetición; no hay bucle infinito
    } catch (error) {
      clearAuthSession();
      throw error;
    }
  }

  const payload = await readResponse(response);
  if (!response.ok || payload?.success === false) {
    throw new ApiError(payload?.message || `Error HTTP ${response.status}`, response.status, payload);
  }

  // El backend devuelve { success, message, data }.
  return payload && Object.prototype.hasOwnProperty.call(payload, 'data')
    ? payload.data
    : payload;
}


// The API limiter is shared by all /api routes (100 requests / 15 minutes per IP).
// Deduplicate concurrent GETs and briefly cache successful reads so React StrictMode,
// quick navigation and components using the same resource do not issue duplicate calls.
const GET_CACHE_TTL_MS = 10_000;
const MAX_GET_CACHE_ENTRIES = 250;
const getResponseCache = new Map();
const inFlightGetRequests = new Map();
let cacheEpoch = 0;

function makeAbortError() {
  if (typeof DOMException !== 'undefined') return new DOMException('La petición fue cancelada.', 'AbortError');
  const error = new Error('La petición fue cancelada.');
  error.name = 'AbortError';
  return error;
}

function withAbortSignal(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(makeAbortError());

  return new Promise((resolve, reject) => {
    const cleanup = () => signal.removeEventListener('abort', onAbort);
    const onAbort = () => {
      cleanup();
      reject(makeAbortError());
    };
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (value) => { cleanup(); resolve(value); },
      (error) => { cleanup(); reject(error); },
    );
  });
}

function makeGetCacheKey(path, options) {
  const session = options.auth === false ? null : getAuthSession();
  const activeCompany = options.company === false ? null : getActiveCompany();
  const suppliedHeaders = [...new Headers(options.headers || {}).entries()]
    .map(([name, value]) => [name.toLowerCase(), value])
    .sort(([left], [right]) => left.localeCompare(right));

  return JSON.stringify({
    path,
    auth: options.auth !== false,
    company: options.company !== false,
    retryAuth: options.retryAuth !== false,
    accessToken: session?.accessToken || null,
    companyId: activeCompany?.id ?? null,
    headers: suppliedHeaders,
  });
}

function trimGetCache() {
  const now = Date.now();
  for (const [key, entry] of getResponseCache) {
    if (entry.expiresAt <= now) getResponseCache.delete(key);
  }
  while (getResponseCache.size > MAX_GET_CACHE_ENTRIES) {
    const oldestKey = getResponseCache.keys().next().value;
    getResponseCache.delete(oldestKey);
  }
}

/**
 * Exported entry point. Successful GET responses are cached for 10 seconds and
 * in-flight GETs are shared. A caller's AbortSignal cancels only that caller's
 * wait, not the shared HTTP request used by other mounted components.
 * Successful writes invalidate cached reads.
 */
export async function apiRequest(path, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  if (method !== 'GET') {
    const result = await performApiRequest(path, options);
    cacheEpoch += 1;
    getResponseCache.clear();
    inFlightGetRequests.clear();
    return result;
  }

  const signal = options.signal;
  const cacheKey = makeGetCacheKey(path, options);
  trimGetCache();

  const cached = getResponseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return withAbortSignal(Promise.resolve(cached.value), signal);
  }

  let requestPromise = inFlightGetRequests.get(cacheKey);
  if (!requestPromise) {
    const requestEpoch = cacheEpoch;
    // Do not bind the shared transport to one component's AbortSignal. The
    // caller still receives AbortError locally via withAbortSignal above.
    const requestOptions = { ...options, signal: undefined };
    requestPromise = performApiRequest(path, requestOptions)
      .then((value) => {
        if (requestEpoch === cacheEpoch) {
          getResponseCache.set(cacheKey, { value, expiresAt: Date.now() + GET_CACHE_TTL_MS });
          trimGetCache();
        }
        return value;
      })
      .finally(() => {
        if (inFlightGetRequests.get(cacheKey) === requestPromise) inFlightGetRequests.delete(cacheKey);
      });
    inFlightGetRequests.set(cacheKey, requestPromise);
  }

  return withAbortSignal(requestPromise, signal);
}
