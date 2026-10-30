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

function roleLabel(role) {
  if (role === 'ADMIN_GLOBAL') return 'Administrador global';
  if (role === 'ADMIN') return 'Administrador';
  if (!role) return 'Usuario';
  return String(role).toLowerCase().replaceAll('_', ' ').replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

function normalizeCompany(row) {
  const id = row?.id ?? row?.Emp_id;
  const name = row?.name ?? row?.nombre ?? row?.Emp_nombre ?? `Empresa ${id ?? ''}`.trim();
  const role = row?.role ?? row?.rolNombre ?? row?.Rol_nombre ?? '';
  return {
    id: id == null ? null : Number(id),
    name,
    shortName: row?.shortName ?? row?.nombreCorto ?? row?.Emp_nombre_corto ?? '',
    role,
    roleLabel: row?.roleLabel ?? roleLabel(role),
    roleId: row?.roleId ?? row?.rolId ?? row?.Rol_id ?? null,
    rfc: row?.rfc ?? row?.Emp_rfc ?? '',
    address: row?.address ?? row?.direccion ?? row?.Emp_direccion ?? '',
    // El backend entrega los permisos de cada empresa en "permisos"
    // tanto en /auth/login como en /auth/me. Se conserva "permissions"
    // como alias de compatibilidad con respuestas anteriores.
    permissions: Array.isArray(row?.permisos)
      ? [...new Set(row.permisos.filter((permission) => typeof permission === 'string'))]
      : Array.isArray(row?.permissions)
        ? [...new Set(row.permissions.filter((permission) => typeof permission === 'string'))]
        : [],
    scope: row?.scope,
  };
}

function mergeGlobalCompanies(assignedRows, allCompanyRows) {
  const assignedById = new Map(assignedRows.map((company) => [String(company.id), company]));
  return allCompanyRows.map((raw) => {
    const item = normalizeCompany(raw);
    const assigned = assignedById.get(String(item.id));
    return {
      ...item,
      role: assigned?.role || 'ADMIN_GLOBAL',
      roleLabel: assigned?.role ? assigned.roleLabel : 'Acceso global',
      roleId: assigned?.roleId ?? null,
      permissions: ['*'],
    };
  });
}

function normalizeUser(user, previousUser = null) {
  if (!user && !previousUser) return null;
  const merged = { ...(previousUser || {}), ...(user || {}) };
  return {
    ...merged,
    id: merged.id ?? merged.Usu_id,
    email: merged.email ?? merged.Usu_correo,
    nombres: merged.nombres || merged.name || merged.email || 'Usuario',
    esAdminGlobal: Boolean(merged.esAdminGlobal ?? merged.isAdminGlobal),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getAuthSession()?.user ?? null);
  const [companies, setCompanies] = useState([]);
  const [isAdminGlobal, setIsAdminGlobal] = useState(Boolean(getAuthSession()?.user?.esAdminGlobal));
  const [activeCompany, setActiveCompanyState] = useState(() => getActiveCompany());
  const [loading, setLoading] = useState(true);

  const applyContext = useCallback(async (context, currentUser, previousUser = null) => {
    const loggedUser = normalizeUser(context?.user ?? currentUser, previousUser);
    const assignedRaw = context?.companies ?? context?.empresas ?? context?.data?.companies ?? context?.data?.empresas ?? [];
    const assignedCompanies = (Array.isArray(assignedRaw) ? assignedRaw : []).map(normalizeCompany);
    const globalByRole = assignedCompanies.some((company) => company.role === 'ADMIN_GLOBAL');
    const global = Boolean(context?.isAdminGlobal ?? context?.esAdminGlobal ?? loggedUser?.esAdminGlobal ?? globalByRole);
    let availableCompanies = assignedCompanies;

    if (global) {
      try {
        const allCompanies = await authApi.getAllCompanies();
        if (allCompanies.length) availableCompanies = mergeGlobalCompanies(assignedCompanies, allCompanies);
      } catch {
        // Si la consulta global no está disponible, se conserva la lista de membresías que devolvió /me.
      }
    }

    const unique = new Map();
    availableCompanies.forEach((company) => {
      if (company.id != null) unique.set(String(company.id), company);
    });
    availableCompanies = [...unique.values()];

    setCompanies(availableCompanies);
    setIsAdminGlobal(global);
    setUser(loggedUser);
    if (loggedUser) {
      saveAuthSession({ ...(getAuthSession() || {}), user: { ...loggedUser, esAdminGlobal: global } });
    }

    const savedCompany = getActiveCompany();
    const match = availableCompanies.find((company) => String(company.id) === String(savedCompany?.id));
    // ADMIN_GLOBAL arranca en ámbito global si no había una empresa elegida.
    // Solo se conserva una empresa cuando el administrador la seleccionó explícitamente.
    if (global) {
      if (match) {
        saveActiveCompany(match);
        setActiveCompanyState(match);
      } else {
        clearActiveCompany();
        setActiveCompanyState(null);
      }
    } else if (availableCompanies.length === 1) {
      saveActiveCompany(availableCompanies[0]);
      setActiveCompanyState(availableCompanies[0]);
    } else if (match) {
      saveActiveCompany(match);
      setActiveCompanyState(match);
    } else {
      clearActiveCompany();
      setActiveCompanyState(null);
    }

    return { user: loggedUser, companies: availableCompanies, isAdminGlobal: global };
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
        const context = await authApi.getMe();
        if (!cancelled) await applyContext(context, context?.user, saved.user);
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

    const mappedUser = normalizeUser(result.user);
    saveAuthSession({ ...result, user: mappedUser });
    const contextResult = await applyContext({
      user: mappedUser,
      empresas: result.empresas || [],
      isAdminGlobal: result.user?.esAdminGlobal,
    }, mappedUser);

    if (contextResult.companies.length === 0) {
      // Se conserva la sesión para mostrar la pantalla de usuario sin empresas asignadas.
      return { nextPath: '/sin-empresas' };
    }
    return { nextPath: '/app' };
  }, [applyContext]);

  const clearCompanySelection = useCallback(() => {
    if (!isAdminGlobal) return;
    clearActiveCompany();
    setActiveCompanyState(null);
  }, [isAdminGlobal]);

  const selectCompany = useCallback((company) => {
    const isAvailableCompany = company?.id != null && companies.some((item) => item.scope !== 'global' && String(item.id) === String(company.id));
    if (!isAvailableCompany) {
      throw new Error('La empresa seleccionada no pertenece a las empresas disponibles en tu contexto.');
    }
    saveActiveCompany(company);
    setActiveCompanyState(company);
  }, [companies]);

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

  const patchCompany = useCallback((companyId, patch) => {
    setCompanies((current) => current.map((company) => String(company.id) === String(companyId) ? { ...company, ...patch } : company));
    const active = getActiveCompany();
    if (String(active?.id) === String(companyId)) {
      const updatedActive = { ...active, ...patch };
      saveActiveCompany(updatedActive);
      setActiveCompanyState(updatedActive);
    }
  }, []);

  const removeCompany = useCallback((companyId) => {
    setCompanies((current) => current.filter((company) => String(company.id) !== String(companyId)));
    const active = getActiveCompany();
    if (String(active?.id) === String(companyId)) {
      clearActiveCompany();
      setActiveCompanyState(null);
    }
  }, []);

  const addCompany = useCallback((rawCompany) => {
    const normalized = normalizeCompany(rawCompany);
    if (normalized.id == null) return;
    const added = {
      ...normalized,
      role: normalized.role || 'ADMIN_GLOBAL',
      roleLabel: normalized.roleLabel || 'Acceso global',
      permissions: ['*'],
    };
    setCompanies((current) => {
      const exists = current.some((company) => String(company.id) === String(added.id));
      const next = exists
        ? current.map((company) => String(company.id) === String(added.id) ? { ...company, ...added } : company)
        : [...current, added];
      return next.sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''), 'es-MX'));
    });
  }, []);

  const can = useCallback((permissionName) => {
    if (isAdminGlobal) return true;
    const required = String(permissionName ?? '').trim().toLocaleLowerCase('es-MX');
    if (!required) return false;
    const permissions = Array.isArray(activeCompany?.permissions) ? activeCompany.permissions : [];
    return permissions.some((permission) => {
      const granted = String(permission ?? '').trim().toLocaleLowerCase('es-MX');
      if (granted === required) return true;
      // El permiso genérico "ver" cubre cualquier consulta de lectura,
      // pero nunca sustituye permisos de crear, editar o eliminar.
      return required.split(':').at(-1) === 'ver' && granted === 'ver';
    });
  }, [activeCompany, isAdminGlobal]);

  const value = useMemo(() => ({
    user, companies, isAdminGlobal, activeCompany, loading, login, logout, selectCompany, clearCompanySelection, patchCompany, removeCompany, addCompany, can,
  }), [user, companies, isAdminGlobal, activeCompany, loading, login, logout, selectCompany, clearCompanySelection, patchCompany, removeCompany, addCompany, can]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return context;
}
