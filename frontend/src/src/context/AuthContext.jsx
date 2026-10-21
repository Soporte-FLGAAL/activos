import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/authApi';
import {
  clearActiveCompany,
  clearAuthSession,
  getActiveCompany,
  getAuthSession,
  saveActiveCompany,
  saveAuthSession,
} from '../services/sessionStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getAuthSession()?.user ?? null);
  const [companies, setCompanies] = useState([]);
  const [isAdminGlobal, setIsAdminGlobal] = useState(false);
  const [activeCompany, setActiveCompanyState] = useState(() => getActiveCompany());
  const [loading, setLoading] = useState(true);

  const applyContext = useCallback((context, currentUser) => {
    const availableCompanies = Array.isArray(context?.companies) ? context.companies : [];
    setCompanies(availableCompanies);
    setIsAdminGlobal(Boolean(context?.isAdminGlobal));
    setUser(currentUser || null);

    const savedCompany = getActiveCompany();
    const match = availableCompanies.find((company) => String(company.id) === String(savedCompany?.id));

    if (availableCompanies.length === 1) {
      saveActiveCompany(availableCompanies[0]);
      setActiveCompanyState(availableCompanies[0]);
    } else if (match) {
      // Actualizar roles/permisos locales con los datos frescos que devuelve el backend.
      saveActiveCompany(match);
      setActiveCompanyState(match);
    } else {
      clearActiveCompany();
      setActiveCompanyState(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      const saved = getAuthSession();
      if (!saved?.refreshToken || !saved?.accessToken) {
        setLoading(false);
        return;
      }

      try {
        const context = await authApi.getContext();
        if (!cancelled) applyContext(context, saved.user);
      } catch {
        clearAuthSession();
        if (!cancelled) {
          setUser(null);
          setCompanies([]);
          setIsAdminGlobal(false);
          setActiveCompanyState(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    restoreSession();
    return () => { cancelled = true; };
  }, [applyContext]);

  const login = useCallback(async (email, password) => {
    clearActiveCompany();
    const result = await authApi.login(email, password);
    if (!result?.accessToken || !result?.refreshToken || !result?.user) {
      throw new Error('La respuesta de login no contiene el usuario y los dos tokens esperados.');
    }

    saveAuthSession(result);
    try {
      const context = await authApi.getContext();
      applyContext(context, result.user);
      const nextCompanies = Array.isArray(context?.companies) ? context.companies : [];
      if (nextCompanies.length === 0) {
        clearAuthSession();
        setUser(null);
        throw new Error('Tu usuario no tiene empresas asignadas. Contacta al administrador del sistema.');
      }
      return { nextPath: '/app' };
    } catch (error) {
      clearAuthSession();
      setUser(null);
      setCompanies([]);
      setActiveCompanyState(null);
      throw error;
    }
  }, [applyContext]);

  const selectCompany = useCallback((company) => {
    const isAllowedGlobalScope = company?.scope === 'global' && isAdminGlobal;
    const isAvailableCompany = company?.id != null && companies.some((item) => item.scope !== 'global' && String(item.id) === String(company.id));
    if (!isAllowedGlobalScope && !isAvailableCompany) {
      throw new Error('La empresa o el ámbito seleccionado no pertenece al contexto del usuario.');
    }
    saveActiveCompany(company);
    setActiveCompanyState(company);
  }, [companies, isAdminGlobal]);

  const logout = useCallback(async () => {
    const refreshToken = getAuthSession()?.refreshToken;
    try {
      await authApi.logout(refreshToken);
    } catch {
      // La sesión local se limpia aunque el servidor no responda al logout.
    } finally {
      clearAuthSession();
      setUser(null);
      setCompanies([]);
      setIsAdminGlobal(false);
      setActiveCompanyState(null);
    }
  }, []);

  const can = useCallback((permissionName) => {
    if (isAdminGlobal) return true;
    return Boolean(activeCompany?.permissions?.includes(permissionName));
  }, [activeCompany, isAdminGlobal]);

  const value = useMemo(() => ({
    user,
    companies,
    isAdminGlobal,
    activeCompany,
    loading,
    login,
    logout,
    selectCompany,
    can,
  }), [user, companies, isAdminGlobal, activeCompany, loading, login, logout, selectCompany, can]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return context;
}
