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
export async function apiRequest(path, options = {}) {
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
