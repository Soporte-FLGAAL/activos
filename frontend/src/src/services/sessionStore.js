const AUTH_KEY = 'activos_auth_session';
const COMPANY_KEY = 'activos_active_company';

export function getAuthSession() {
  try {
    const value = sessionStorage.getItem(AUTH_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function saveAuthSession(session) {
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  sessionStorage.removeItem(AUTH_KEY);
  clearActiveCompany();
}

export function getActiveCompany() {
  try {
    const value = sessionStorage.getItem(COMPANY_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function saveActiveCompany(company) {
  sessionStorage.setItem(COMPANY_KEY, JSON.stringify(company));
}

export function clearActiveCompany() {
  sessionStorage.removeItem(COMPANY_KEY);
}
