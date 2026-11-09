import { apiRequest } from './apiClient';

function queryString(values = {}) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });
  return query.toString();
}

export async function listRecords(endpoint, filters = {}, options = {}) {
  const query = queryString({ page: 1, limit: 200, ...filters });
  const result = await apiRequest(`${endpoint}?${query}`, options);
  return {
    items: Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [],
    pagination: result?.pagination || null,
  };
}

export async function uploadDocument(file, type, companyId, options = {}) {
  if (!file) return null;
  const { metadata = {}, ...requestOptions } = options;
  const form = new FormData();
  // El backend decide la carpeta con "tipo"; los metadatos adicionales
  // permiten nombrar y clasificar correctamente las constancias.
  form.append('tipo', type);
  Object.entries(metadata).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') form.append(key, String(value));
  });
  form.append('archivo', file, file.name);

  const result = await apiRequest('/upload', {
    ...requestOptions,
    method: 'POST',
    headers: {
      ...(requestOptions.headers || {}),
      ...(companyId ? { 'X-Empresa-Id': String(companyId) } : {}),
    },
    body: form,
  });

  if (!result?.url) throw new Error('El servidor no devolvió la URL del archivo subido.');
  return { ...result, url: toAbsoluteFileUrl(result.url) };
}

export async function deleteUploadedDocument(fileUrl, companyId, options = {}) {
  const value = String(fileUrl || '').trim();
  const match = value.match(/\/upload\/([0-9a-f-]{36})(?:[/?#]|$)/i);
  if (!match) return { deleted: false, skipped: true };

  return apiRequest(`/upload/${encodeURIComponent(match[1])}`, {
    ...options,
    method: 'DELETE',
    headers: {
      ...(options.headers || {}),
      ...(companyId ? { 'X-Empresa-Id': String(companyId) } : {}),
    },
  });
}

function toAbsoluteFileUrl(url) {
  const configured = import.meta.env.VITE_PUBLIC_API_BASE_URL || import.meta.env.VITE_API_URL || '/api';
  try {
    if (/^https?:\/\//i.test(configured)) {
      return new URL(url, new URL(configured).origin).href;
    }
    return new URL(url, window.location.origin).href;
  } catch {
    return url;
  }
}

export function createUnit(payload, companyId, options = {}) {
  return apiRequest('/unidades', {
    ...options,
    method: 'POST',
    headers: { ...(options.headers || {}), ...(companyId ? { 'X-Empresa-Id': String(companyId) } : {}) },
    body: JSON.stringify(payload),
  });
}

export function createPlate(payload, companyId, options = {}) {
  return apiRequest('/placas', {
    ...options,
    method: 'POST',
    headers: { ...(options.headers || {}), ...(companyId ? { 'X-Empresa-Id': String(companyId) } : {}) },
    body: JSON.stringify(payload),
  });
}


export function createPlateDetail(payload, companyId, options = {}) {
  return apiRequest('/detalle-placas', {
    ...options,
    method: 'POST',
    headers: { ...(options.headers || {}), ...(companyId ? { 'X-Empresa-Id': String(companyId) } : {}) },
    body: JSON.stringify(payload),
  });
}

export function createDoubleArticulatedPermit(payload, companyId, options = {}) {
  return apiRequest('/doble-articulado', {
    ...options,
    method: 'POST',
    headers: { ...(options.headers || {}), ...(companyId ? { 'X-Empresa-Id': String(companyId) } : {}) },
    body: JSON.stringify(payload),
  });
}

export function createSictPermit(payload, companyId, options = {}) {
  return apiRequest('/sict', {
    ...options,
    method: 'POST',
    headers: { ...(options.headers || {}), ...(companyId ? { 'X-Empresa-Id': String(companyId) } : {}) },
    body: JSON.stringify(payload),
  });
}

export function createCirculationCard(payload, companyId, options = {}) {
  return apiRequest('/tarjetas', {
    ...options,
    method: 'POST',
    headers: { ...(options.headers || {}), ...(companyId ? { 'X-Empresa-Id': String(companyId) } : {}) },
    body: JSON.stringify(payload),
  });
}

export function createPolicy(payload, companyId, withInitialEndorsement = true, options = {}) {
  return apiRequest(withInitialEndorsement ? '/polizas/crear-con-endosos' : '/polizas', {
    ...options,
    method: 'POST',
    headers: { ...(options.headers || {}), ...(companyId ? { 'X-Empresa-Id': String(companyId) } : {}) },
    body: JSON.stringify(payload),
  });
}

export function createEndorsement(payload, companyId, options = {}) {
  return apiRequest('/endosos', {
    ...options,
    method: 'POST',
    headers: { ...(options.headers || {}), ...(companyId ? { 'X-Empresa-Id': String(companyId) } : {}) },
    body: JSON.stringify(payload),
  });
}

export function createInciso(payload, companyId, options = {}) {
  return apiRequest('/incisos', {
    ...options,
    method: 'POST',
    headers: { ...(options.headers || {}), ...(companyId ? { 'X-Empresa-Id': String(companyId) } : {}) },
    body: JSON.stringify(payload),
  });
}
