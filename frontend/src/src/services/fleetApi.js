import { apiRequest } from './apiClient';

function toQuery(values = {}) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  return params.toString();
}

export async function getActiveUnitsCount(companyId, options = {}) {
  const data = await apiRequest(`/unidades/empresa/${encodeURIComponent(companyId)}/total`, {
    ...options,
    headers: { ...(options.headers || {}), 'X-Empresa-Id': String(companyId) },
  });
  return Number(data?.total ?? 0);
}

export async function getUnits(filters = {}, options = {}) {
  const query = toQuery({ page: 1, limit: 200, ...filters });
  const result = await apiRequest(`/unidades?${query}`, options);
  return {
    items: Array.isArray(result?.data) ? result.data : [],
    pagination: result?.pagination || { page: 1, limit: 200, total: 0, totalPages: 1 },
  };
}

export async function getCirculationCards(options = {}) {
  const result = await apiRequest('/tarjetas?page=1&limit=200', options);
  return Array.isArray(result?.data) ? result.data : [];
}
