import { apiRequest } from './apiClient';

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

  getContext() {
    return apiRequest('/auth/context', { method: 'GET', company: false });
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
