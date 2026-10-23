import { apiRequest } from './apiClient';

function toQuery(values = {}) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  return params.toString();
}

export async function getRegistryPage(endpoint, { page = 1, limit = 20, ...filters } = {}, options = {}) {
  const query = toQuery({ ...filters, page, limit });
  const result = await apiRequest(`${endpoint}?${query}`, options);
  return {
    items: Array.isArray(result?.data) ? result.data : [],
    pagination: result?.pagination || { page, limit, total: 0, totalPages: 1 },
  };
}

export async function getRegistryCount(endpoint, options = {}) {
  const result = await getRegistryPage(endpoint, { page: 1, limit: 1 }, options);
  return Number(result.pagination.total || 0);
}
