import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, KeyRound, LoaderCircle, Save, Search, Shield, X } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/apiClient';
import { getRegistryPage } from '../services/registryApi';

const SYSTEM_ROLE = 'ADMIN_GLOBAL';

async function getAllRows(endpoint, signal, maxPages = 100) {
  const rows = [];
  let page = 1;
  let totalPages = 1;
  do {
    const result = await getRegistryPage(endpoint, { page, limit: 100 }, { signal, company: false });
    rows.push(...result.items);
    totalPages = Math.max(1, Number(result.pagination?.totalPages || 1));
    page += 1;
  } while (page <= totalPages && page <= maxPages && !signal?.aborted);
  return rows;
}

export default function RolePermissionsAdminPage() {
  const navigate = useNavigate();
  const { isAdminGlobal } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [assignedIds, setAssignedIds] = useState([]);
  const [baselineIds, setBaselineIds] = useState([]);
  const [query, setQuery] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingRelations, setLoadingRelations] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!isAdminGlobal) return undefined;
    const controller = new AbortController();
    setLoadingOptions(true);
    Promise.all([
      getAllRows('/roles', controller.signal),
      getAllRows('/permisos', controller.signal),
    ]).then(([roleRows, permissionRows]) => {
      if (controller.signal.aborted) return;
      setRoles(roleRows);
      setPermissions(permissionRows);
      setSelectedRoleId((current) => current || String(roleRows[0]?.Rol_id || ''));
    }).catch((loadError) => {
      if (!controller.signal.aborted) setError(loadError.message || 'No se pudieron cargar los roles y permisos.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoadingOptions(false);
    });
    return () => controller.abort();
  }, [isAdminGlobal]);

  const selectedRole = useMemo(() => roles.find((role) => String(role.Rol_id) === String(selectedRoleId)), [roles, selectedRoleId]);
  const isSystemRole = selectedRole?.Rol_nombre === SYSTEM_ROLE;
  const filteredPermissions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es-MX');
    return normalized ? permissions.filter((permission) => String(permission.PerM_nombre || '').toLocaleLowerCase('es-MX').includes(normalized)) : permissions;
  }, [permissions, query]);
  const pendingChanges = useMemo(() => {
    const current = new Set(assignedIds.map(Number));
    const baseline = new Set(baselineIds.map(Number));
    return [...current].filter((id) => !baseline.has(id)).length + [...baseline].filter((id) => !current.has(id)).length;
  }, [assignedIds, baselineIds]);

  useEffect(() => {
    if (!selectedRoleId) {
      setAssignedIds([]);
      setBaselineIds([]);
      return undefined;
    }
    const controller = new AbortController();
    setLoadingRelations(true);
    setError('');
    getRegistryPage(`/rol-permisos/rol/${selectedRoleId}`, { page: 1, limit: 250 }, { signal: controller.signal, company: false })
      .then((result) => {
        if (controller.signal.aborted) return;
        const ids = result.items.map((item) => Number(item.PerM_id ?? item.RP_permiso ?? item.permisoId)).filter(Number.isFinite);
        setAssignedIds(ids);
        setBaselineIds(ids);
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) {
          setAssignedIds([]);
          setBaselineIds([]);
          setError(loadError.message || 'No se pudieron consultar los permisos asignados al rol.');
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoadingRelations(false); });
    return () => controller.abort();
  }, [selectedRoleId]);

  const togglePermission = (permissionId, checked) => {
    setAssignedIds((current) => {
      const existing = new Set(current.map(Number));
      if (checked) existing.add(Number(permissionId));
      else existing.delete(Number(permissionId));
      return [...existing];
    });
  };

  const reloadRelations = useCallback(async (roleId) => {
    const result = await getRegistryPage(`/rol-permisos/rol/${roleId}`, { page: 1, limit: 250 }, { company: false });
    const ids = result.items.map((item) => Number(item.PerM_id ?? item.RP_permiso ?? item.permisoId)).filter(Number.isFinite);
    setAssignedIds(ids);
    setBaselineIds(ids);
  }, []);

  async function saveRelations() {
    if (!selectedRoleId || isSystemRole || saving) return;
    setSaving(true); setError(''); setToast('');
    const roleId = Number(selectedRoleId);
    const before = new Set(baselineIds.map(Number));
    const after = new Set(assignedIds.map(Number));
    try {
      for (const permissionId of before) {
        if (!after.has(permissionId)) {
          await apiRequest(`/rol-permisos/${roleId}/${permissionId}`, { method: 'DELETE', company: false });
        }
      }
      for (const permissionId of after) {
        if (!before.has(permissionId)) {
          await apiRequest('/rol-permisos', { method: 'POST', company: false, body: JSON.stringify({ rolId: roleId, permisoId: permissionId }) });
        }
      }
      await reloadRelations(roleId);
      setToast('Los permisos del rol se actualizaron correctamente.');
    } catch (saveError) {
      setError(saveError.message || 'No se pudieron guardar todas las relaciones. Se volverá a consultar el estado real del rol.');
      try { await reloadRelations(roleId); } catch { /* Se conserva el error de guardado original. */ }
    } finally { setSaving(false); }
  }

  if (!isAdminGlobal) return <Navigate to="/app" replace />;

  return (
    <WorkspaceLayout activeNav="settings">
      <section className="registry-heading admin-directory-heading">
        <button type="button" className="registry-back" onClick={() => navigate('/administracion')} aria-label="Volver"><ArrowLeft size={18} /></button>
        <div className="registry-heading-copy"><p className="registry-breadcrumb">Administración / Roles y permisos</p><h1>Roles y permisos</h1><p className="workspace-subtitle">Selecciona un rol y define qué acciones puede realizar dentro del sistema.</p></div>
      </section>

      <div className="registry-panel role-permissions-panel">
        <div className="registry-panel-heading"><div><Shield size={17} /><strong>Relación rol_permisos</strong></div><span>{loadingOptions ? 'Consultando…' : `${roles.length} roles · ${permissions.length} permisos disponibles`}</span></div>
        {loadingOptions ? <div className="workspace-loading"><LoaderCircle size={17} className="spin" /> Cargando roles y permisos…</div> : <>
          <div className="role-permissions-toolbar">
            <label className="admin-form-field"><span>Rol a configurar</span><select value={selectedRoleId} onChange={(event) => { setSelectedRoleId(event.target.value); setToast(''); }}><option value="">Selecciona un rol…</option>{roles.map((role) => <option key={role.Rol_id} value={String(role.Rol_id)}>{role.Rol_nombre}</option>)}</select></label>
            <label className="registry-search"><Search size={16} /><input type="search" placeholder="Buscar permiso…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          </div>
          {isSystemRole && <div className="admin-system-warning role-permissions-warning"><Shield size={16} /> ADMIN_GLOBAL es un rol protegido. Puedes consultar sus permisos, pero no modificar sus relaciones desde esta pantalla.</div>}
          <div className="role-permissions-summary"><span><KeyRound size={15} /> {assignedIds.length} asignados</span><span>{pendingChanges ? `${pendingChanges} cambio(s) sin guardar` : 'Sin cambios pendientes'}</span></div>
          {loadingRelations ? <div className="workspace-loading"><LoaderCircle size={17} className="spin" /> Cargando permisos asignados…</div> : !selectedRoleId ? <div className="workspace-empty-state"><Shield size={27} /><h2>Selecciona un rol</h2><p>Primero elige el rol al que deseas asignar permisos.</p></div> : filteredPermissions.length === 0 ? <div className="workspace-empty-state"><KeyRound size={27} /><h2>Sin permisos coincidentes</h2><p>Prueba con otro criterio de búsqueda.</p></div> : <div className="role-permissions-grid">{filteredPermissions.map((permission) => {
            const checked = assignedIds.includes(Number(permission.PerM_id));
            return <label key={permission.PerM_id} className={`role-permission-card${checked ? ' is-assigned' : ''}${isSystemRole ? ' is-protected' : ''}`}>
              <input type="checkbox" checked={checked} disabled={isSystemRole || loadingRelations || saving} onChange={(event) => togglePermission(permission.PerM_id, event.target.checked)} />
              <span className="role-permission-card-icon"><KeyRound size={16} /></span>
              <span className="role-permission-card-copy"><strong>{permission.PerM_nombre}</strong><small>{checked ? 'Asignado a este rol' : 'No asignado'}</small></span>
              {checked && <Check size={16} className="role-permission-check" />}
            </label>;
          })}</div>}
          {error && <div className="workspace-error role-permissions-error"><AlertCircle size={16} /><span>{error}</span></div>}
          <footer className="role-permissions-footer"><span>Los cambios se guardan en la tabla de relación <strong>Rol_Permisos</strong>.</span><button type="button" className="workspace-primary-button" onClick={saveRelations} disabled={!selectedRoleId || isSystemRole || loadingRelations || saving || pendingChanges === 0}>{saving ? <><LoaderCircle size={15} className="spin" /> Guardando…</> : <><Save size={15} /> Guardar permisos</>}</button></footer>
        </>}
      </div>
      {toast && <div className="catalog-toast" role="status"><Check size={16} /><span>{toast}</span><button type="button" aria-label="Cerrar aviso" onClick={() => setToast('')}><X size={15} /></button></div>}
    </WorkspaceLayout>
  );
}
