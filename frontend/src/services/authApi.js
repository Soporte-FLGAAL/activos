import { apiRequest } from './apiClient';

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

export const authApi = {
  login(email, password) {
    return apiRequest('/auth/login', {
      method: 'POST',
      auth: false,
      company: false,
      retryAuth: false,
      body: JSON.stringify({ email, password }),
    });
  },

  // Backend v22 expone GET /api/auth/me. No existe /api/auth/context en esa versión.
  getMe() {
    return apiRequest('/auth/me', { method: 'GET', company: false });
  },

  async getAllCompanies() {
    const all = [];
    let page = 1;
    let totalPages = 1;
    do {
      const result = await apiRequest(`/empresas?page=${page}&limit=100`, {
        method: 'GET',
        company: false,
      });
      const rows = toArray(result?.data);
      all.push(...rows);
      totalPages = Math.max(1, Number(result?.pagination?.totalPages || 1));
      page += 1;
    } while (page <= totalPages && page <= 100);
    return all;
  },

  logout(refreshToken) {
    if (!refreshToken) return Promise.resolve(null);
    return apiRequest('/auth/logout', {
      method: 'POST',
      auth: false,
      company: false,
      retryAuth: false,
      body: JSON.stringify({ refreshToken }),
    });
  },
};
