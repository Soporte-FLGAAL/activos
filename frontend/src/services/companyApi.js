import { apiRequest } from './apiClient';

export function getCompanyById(companyId, options = {}) {
  return apiRequest(`/empresas/${encodeURIComponent(companyId)}`, {
    ...options,
    headers: { ...(options.headers || {}), 'X-Empresa-Id': String(companyId) },
  });
}

export function updateCompany(companyId, form) {
  return apiRequest(`/empresas/${encodeURIComponent(companyId)}`, {
    method: 'PUT',
    body: JSON.stringify({
      nombre: form.nombre,
      nombreCorto: form.nombreCorto || null,
      direccion: form.direccion || null,
      rfc: form.rfc,
    }),
  });
}

export function deleteCompany(companyId) {
  return apiRequest(`/empresas/${encodeURIComponent(companyId)}`, { method: 'DELETE' });
}
