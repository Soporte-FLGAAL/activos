import { apiRequest } from './apiClient';

function toQuery(values = {}) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  return params.toString();
}
function normalizePage(result, defaultLimit = 20) {
  return { items: Array.isArray(result?.data) ? result.data : [], pagination: result?.pagination || { page: 1, limit: defaultLimit, total: 0, totalPages: 1 } };
}
export async function getActiveUnitsCount(companyId, options = {}) {
  const data = await apiRequest(`/unidades/empresa/${encodeURIComponent(companyId)}/total`, { ...options, headers: { ...(options.headers || {}), 'X-Empresa-Id': String(companyId) } });
  return Number(data?.total ?? 0);
}
export async function getUnits(filters = {}, options = {}) {
  const query = toQuery({ page: 1, limit: 20, ...filters });
  return normalizePage(await apiRequest(`/unidades?${query}`, options), Number(filters.limit || 20));
}
export async function getUnitById(id, options = {}) { return apiRequest(`/unidades/${encodeURIComponent(id)}`, options); }
export async function updateUnit(id, payload, options = {}) { return apiRequest(`/unidades/${encodeURIComponent(id)}`, { ...options, method: 'PUT', body: JSON.stringify(payload) }); }
export async function deleteUnit(id, options = {}) { return apiRequest(`/unidades/${encodeURIComponent(id)}`, { ...options, method: 'DELETE' }); }
export async function getUnitTypes(options = {}) {
  return normalizePage(await apiRequest(`/catalogos/tipo-unidad?${toQuery({ page: 1, limit: 100 })}`, options), 100).items;
}
async function getList(path, filters = {}, options = {}) {
  return normalizePage(await apiRequest(`${path}?${toQuery({ page: 1, limit: 100, ...filters })}`, options), Number(filters.limit || 100)).items;
}
export function getCirculationCards(filters = {}, options = {}) { return getList('/tarjetas', filters, options); }
export function getPlates(filters = {}, options = {}) { return getList('/placas', filters, options); }
export async function getPlatePage(filters = {}, options = {}) { return normalizePage(await apiRequest(`/placas?${toQuery({ page: 1, limit: 20, ...filters })}`, options), Number(filters.limit || 20)); }
export async function getCardPage(filters = {}, options = {}) { return normalizePage(await apiRequest(`/tarjetas?${toQuery({ page: 1, limit: 20, ...filters })}`, options), Number(filters.limit || 20)); }
export function getPlateMovements(filters = {}, options = {}) { return getList('/detalle-placas', filters, options); }
export function getPlateMovementTypes(options = {}) { return getList('/catalogos/tipo-movimiento-placa', {}, options); }
export function getCardTypes(options = {}) { return getList('/catalogos/tipo-tarjeta', {}, options); }
export function createPlate(payload, options = {}) { return apiRequest('/placas', { ...options, method: 'POST', body: JSON.stringify(payload) }); }
export function updatePlate(id, payload, options = {}) { return apiRequest(`/placas/${encodeURIComponent(id)}`, { ...options, method: 'PUT', body: JSON.stringify(payload) }); }
export function deletePlate(id, options = {}) { return apiRequest(`/placas/${encodeURIComponent(id)}`, { ...options, method: 'DELETE' }); }
export function createPlateMovement(payload, options = {}) { return apiRequest('/detalle-placas', { ...options, method: 'POST', body: JSON.stringify(payload) }); }
export function createCard(payload, options = {}) { return apiRequest('/tarjetas', { ...options, method: 'POST', body: JSON.stringify(payload) }); }
export function updateCard(id, payload, options = {}) { return apiRequest(`/tarjetas/${encodeURIComponent(id)}`, { ...options, method: 'PUT', body: JSON.stringify(payload) }); }
export function deleteCard(id, options = {}) { return apiRequest(`/tarjetas/${encodeURIComponent(id)}`, { ...options, method: 'DELETE' }); }
export async function getCardsByUnitIds(unitIds = [], options = {}) {
  const wanted = new Set(unitIds.map(String));
  const found = new Map();
  if (!wanted.size) return {};
  const pageSize = 1000;
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages && page <= 10) {
    const result = await apiRequest(`/tarjetas?${toQuery({ page, limit: pageSize })}`, options);
    const normalized = normalizePage(result, pageSize);
    normalized.items.forEach((card) => {
      const key = String(card?.TC_unidad_id ?? card?.unidadId ?? '');
      if (wanted.has(key) && (!found.has(key) || Number(card.TC_id || 0) > Number(found.get(key).TC_id || 0))) found.set(key, card);
    });
    totalPages = Math.max(1, Number(normalized.pagination.totalPages || 1));
    page += 1;
  }
  return Object.fromEntries([...wanted].map((id) => [id, found.get(id) || null]));
}
export function getPolicies(filters = {}, options = {}) { return getList('/polizas', filters, options); }
export function getEndorsements(filters = {}, options = {}) { return getList('/endosos', filters, options); }
export function getIncisos(filters = {}, options = {}) { return getList('/incisos', filters, options); }
export function getDoubleArticulatedPermits(filters = {}, options = {}) { return getList('/doble-articulado', filters, options); }
export function getSictPermits(filters = {}, options = {}) { return getList('/sict', filters, options); }
export function getCotejos(filters = {}, options = {}) { return getList('/cotejos', filters, options); }
