import { apiRequest } from './apiClient';

function toQuery(values = {}) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  return params.toString();
}

function normalizePage(result, defaultLimit = 20) {
  return {
    items: Array.isArray(result?.data) ? result.data : [],
    pagination: result?.pagination || { page: 1, limit: defaultLimit, total: 0, totalPages: 1 },
  };
}

export async function getActiveUnitsCount(companyId, options = {}) {
  const data = await apiRequest(`/unidades/empresa/${encodeURIComponent(companyId)}/total`, {
    ...options,
    headers: { ...(options.headers || {}), 'X-Empresa-Id': String(companyId) },
  });
  return Number(data?.total ?? 0);
}

export async function getUnits(filters = {}, options = {}) {
  const query = toQuery({ page: 1, limit: 20, ...filters });
  const result = await apiRequest(`/unidades?${query}`, options);
  return normalizePage(result, Number(filters.limit || 20));
}

export async function getUnitById(id, options = {}) {
  return apiRequest(`/unidades/${encodeURIComponent(id)}`, options);
}

export async function getUnitTypes(options = {}) {
  const query = toQuery({ page: 1, limit: 100 });
  const result = await apiRequest(`/catalogos/tipo-unidad?${query}`, options);
  return normalizePage(result, 100).items;
}

async function getList(path, filters = {}, options = {}) {
  const query = toQuery({ page: 1, limit: 100, ...filters });
  const result = await apiRequest(`${path}?${query}`, options);
  return normalizePage(result, Number(filters.limit || 100)).items;
}

export function getCirculationCards(filters = {}, options = {}) {
  return getList('/tarjetas', filters, options);
}

export function getPolicies(filters = {}, options = {}) {
  return getList('/polizas', filters, options);
}

export function getEndorsements(filters = {}, options = {}) {
  return getList('/endosos', filters, options);
}

export function getIncisos(filters = {}, options = {}) {
  return getList('/incisos', filters, options);
}

export function getDoubleArticulatedPermits(filters = {}, options = {}) {
  return getList('/doble-articulado', filters, options);
}

export function getSictPermits(filters = {}, options = {}) {
  return getList('/sict', filters, options);
}

export function getCotejos(filters = {}, options = {}) {
  return getList('/cotejos', filters, options);
}
