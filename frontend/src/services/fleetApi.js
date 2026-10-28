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

/**
 * Fetch circulation-card records for the units visible on the current page
 * in batches, rather than issuing one HTTP request per unit (N+1 requests).
 * Reads bounded pages to prefer the newest card ID for each requested unit. A
 * 10-page cap bounds the request count and avoids unbounded dashboard queries.
 */
export async function getCardsByUnitIds(unitIds = [], options = {}) {
  const requestedIds = [...new Set(unitIds.map((id) => String(id)))];
  const wanted = new Set(requestedIds);
  const found = new Map();
  if (!wanted.size) return {};

  const pageSize = 1000;
  const maxPages = 10;
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= maxPages) {
    const query = toQuery({ page, limit: pageSize });
    const result = await apiRequest(`/tarjetas?${query}`, options);
    const normalized = normalizePage(result, pageSize);

    normalized.items.forEach((card) => {
      const unitId = card?.TC_unidad_id ?? card?.unidadId;
      const key = String(unitId ?? '');
      if (!wanted.has(key)) return;
      const previous = found.get(key);
      if (!previous || Number(card.TC_id || 0) > Number(previous.TC_id || 0)) found.set(key, card);
    });

    totalPages = Math.max(1, Number(normalized.pagination.totalPages || 1));
    page += 1;
  }

  return Object.fromEntries(requestedIds.map((id) => [id, found.get(id) || null]));
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
