import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Activity, AlertCircle, ArrowLeft, Check, Edit3, KeyRound, Plus, RefreshCw,
  Search, Shield, Trash2, Users, Building2, X,
} from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/apiClient';
import { getRegistryPage } from '../services/registryApi';

const REGISTRIES = {
  usuarios: {
    title: 'Usuarios', subtitle: 'Cuentas de acceso, empresas asignadas y estado de usuario.', endpoint: '/usuarios', activeNav: 'users', idKey: 'Usu_id', system: 'users',
    columns: [
      { label: 'ID', key: 'Usu_id' },
      { label: 'Nombre', value: (row) => [row.Usu_nombres, row.Usu_ap_paterno, row.Usu_ap_materno].filter(Boolean).join(' ') },
      { label: 'Correo electrónico', key: 'Usu_correo' },
      { label: 'Teléfono', key: 'Usu_telefono' },
      { label: 'Estado', key: 'Usu_status', badge: true },
    ],
  },
  roles: {
    title: 'Roles', subtitle: 'Gestiona roles y los permisos que agrupan.', endpoint: '/roles', activeNav: 'settings', idKey: 'Rol_id', system: 'roles',
    columns: [{ label: 'ID', key: 'Rol_id' }, { label: 'Nombre del rol', key: 'Rol_nombre' }],
  },
  aseguradoras: {
    title: 'Aseguradoras', subtitle: 'Directorio de compañías aseguradoras.', endpoint: '/aseguradoras', activeNav: 'settings', idKey: 'Ase_id', system: 'insurers',
    columns: [
      { label: 'ID', key: 'Ase_id' }, { label: 'Aseguradora', key: 'Ase_nombre' }, { label: 'RFC', key: 'Ase_rfc' },
      { label: 'Teléfono', key: 'Ase_telefono' }, { label: 'Dirección', key: 'Ase_direccion' },
    ],
  },
  permisos: {
    title: 'Permisos', subtitle: 'Permisos disponibles para asignar a los roles del sistema.', endpoint: '/permisos', activeNav: 'settings', idKey: 'PerM_id', system: 'permissions',
    columns: [{ label: 'ID', key: 'PerM_id' }, { label: 'Nombre del permiso', key: 'PerM_nombre' }],
  },
};

const EMPTY_PAGE = { page: 1, limit: 20, total: 0, totalPages: 1 };
const GLOBAL_ROLE = 'ADMIN_GLOBAL';

function toUserForm(row = {}) {
  return {
    nombres: row.Usu_nombres || '', apPaterno: row.Usu_ap_paterno || '', apMaterno: row.Usu_ap_materno || '',
    telefono: row.Usu_telefono || '', correo: row.Usu_correo || '', password: '', nuevaPassword: '',
  };
}
function toInsurerForm(row = {}) {
  return { nombre: row.Ase_nombre || '', rfc: row.Ase_rfc || '', telefono: row.Ase_telefono || '', direccion: row.Ase_direccion || '' };
}
function toRoleForm(row = {}) { return { nombre: row.Rol_nombre || '' }; }
function toPermissionForm(row = {}) { return { nombre: row.PerM_nombre || '' }; }

function getForm(system, row) {
  if (system === 'users') return toUserForm(row);
  if (system === 'roles') return toRoleForm(row);
  if (system === 'permissions') return toPermissionForm(row);
  return toInsurerForm(row);
}

function Modal({ title, subtitle, children, onClose, wide = false }) {
  return createPortal(
    <div className="workspace-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`workspace-modal admin-editor-modal${wide ? ' is-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="admin-editor-title">
        <button className="workspace-modal-close" type="button" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        <div className="workspace-modal-icon"><Edit3 size={19} /></div>
        <h2 id="admin-editor-title">{title}</h2>
        {subtitle && <p>{subtitle}</p>}
        {children}
      </section>
    </div>,
    document.body,
  );
}

function Field({ label, value, onChange, required = false, type = 'text', maxLength, minLength, autoComplete }) {
  return <label className="admin-form-field"><span>{label}{required ? ' *' : ''}</span><input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} required={required} maxLength={maxLength} minLength={minLength} autoComplete={autoComplete} /></label>;
}

function AssignmentEditor({ editor, setEditor, companies, roles }) {
  const rows = editor.assignmentRows || [];
  function updateRow(index, patch) {
    setEditor((current) => ({ ...current, assignmentRows: current.assignmentRows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row) }));
  }
  const usedCompanies = rows.map((row) => String(row.empresaId || '')).filter(Boolean);
  return (
    <section className="admin-assignment-section">
      <div className="admin-assignment-heading"><div><Building2 size={16} /><strong>Empresas y roles</strong></div><button type="button" className="admin-secondary-button" onClick={() => setEditor((current) => ({ ...current, assignmentRows: [...(current.assignmentRows || []), { empresaId: '', rolId: '' }] }))}><Plus size={14} /> Agregar</button></div>
      <p>Un usuario puede tener un rol distinto en cada empresa. Si no se asigna una empresa, la cuenta quedará sin acceso a módulos de empresa.</p>
      {editor.assignmentsLoading ? <div className="admin-inline-loading">Cargando asignaciones…</div> : rows.length === 0 ? <div className="admin-inline-empty">Sin empresas asignadas. Usa “Agregar” para dar acceso.</div> : rows.map((assignment, index) => (
        <div className="admin-assignment-row" key={`${assignment.originalEmpresaId || 'new'}-${index}`}>
          <label className="admin-form-field"><span>Empresa</span><select value={assignment.empresaId ?? ''} onChange={(event) => updateRow(index, { empresaId: event.target.value })}>
            <option value="">Seleccionar empresa…</option>
            {companies.filter((company) => String(company.id) === String(assignment.empresaId) || !usedCompanies.includes(String(company.id))).map((company) => <option key={company.id} value={String(company.id)}>{company.name}</option>)}
          </select></label>
          <label className="admin-form-field"><span>Rol</span><select value={assignment.rolId ?? ''} onChange={(event) => updateRow(index, { rolId: event.target.value })}>
            <option value="">Seleccionar rol…</option>
            {roles.map((role) => <option key={role.Rol_id} value={String(role.Rol_id)}>{role.Rol_nombre}</option>)}
          </select></label>
          <button className="admin-icon-action is-danger" type="button" title="Quitar asignación" aria-label="Quitar asignación" onClick={() => setEditor((current) => ({ ...current, assignmentRows: current.assignmentRows.filter((_, rowIndex) => rowIndex !== index) }))}><X size={15} /></button>
        </div>
      ))}
    </section>
  );
}

function RegistryEditor({ registry, editor, setEditor, companies, roles, permissions, busy, error, onSubmit, onClose }) {
  const { system } = registry;
  const isEdit = editor.mode === 'edit';
  const form = editor.form;
  const isSystemRole = system === 'roles' && editor.item?.Rol_nombre === GLOBAL_ROLE;
  const updateForm = (name, value) => setEditor((current) => ({ ...current, form: { ...current.form, [name]: value } }));
  const selectedPermissionIds = new Set((editor.permissionIds || []).map(Number));
  function togglePermission(permissionId, checked) {
    setEditor((current) => {
      const existing = new Set((current.permissionIds || []).map(Number));
      if (checked) existing.add(Number(permissionId)); else existing.delete(Number(permissionId));
      return { ...current, permissionIds: [...existing] };
    });
  }

  return <Modal title={isEdit ? `Editar ${registry.singular}` : `Nuevo ${registry.singular}`} subtitle={isEdit ? `ID de registro: ${editor.item?.[registry.idKey]}` : 'Completa los campos y guarda los cambios.'} onClose={onClose} wide={system === 'users' || system === 'roles'}>
    <form className="admin-editor-form" onSubmit={onSubmit}>
      {system === 'users' && <>
        <div className="admin-form-grid">
          <Field label="Nombre(s)" value={form.nombres} onChange={(v) => updateForm('nombres', v)} required maxLength={50} autoComplete="given-name" />
          <Field label="Apellido paterno" value={form.apPaterno} onChange={(v) => updateForm('apPaterno', v)} required maxLength={25} autoComplete="family-name" />
          <Field label="Apellido materno" value={form.apMaterno} onChange={(v) => updateForm('apMaterno', v)} maxLength={25} />
          <Field label="Teléfono" value={form.telefono} onChange={(v) => updateForm('telefono', v)} maxLength={13} />
          <Field label="Correo electrónico" type="email" value={form.correo} onChange={(v) => updateForm('correo', v)} required maxLength={255} autoComplete="email" />
          {!isEdit && <Field label="Contraseña inicial" type="password" value={form.password} onChange={(v) => updateForm('password', v)} required minLength={8} maxLength={128} autoComplete="new-password" />}
          {isEdit && <Field label="Nueva contraseña (opcional)" type="password" value={form.nuevaPassword} onChange={(v) => updateForm('nuevaPassword', v)} maxLength={128} autoComplete="new-password" />}
        </div>
        <AssignmentEditor editor={editor} setEditor={setEditor} companies={companies} roles={roles} />
      </>}
      {system === 'roles' && <>
        <Field label="Nombre del rol" value={form.nombre} onChange={(v) => updateForm('nombre', v)} required maxLength={20} />
        {isSystemRole ? <div className="admin-system-warning"><Shield size={16} /> ADMIN_GLOBAL es un rol de sistema: el nombre no se puede modificar. Los permisos deben revisarse con cuidado.</div> : <section className="admin-permission-section">
          <div className="admin-assignment-heading"><div><KeyRound size={16} /><strong>Permisos del rol</strong></div><span>{selectedPermissionIds.size} seleccionados</span></div>
          <p>Selecciona los permisos que se asignarán a este rol. El backend sigue siendo quien autoriza cada petición.</p>
          {editor.permissionsLoading ? <div className="admin-inline-loading">Cargando permisos…</div> : permissions.length === 0 ? <div className="admin-inline-empty">No se pudieron cargar permisos disponibles.</div> : <div className="admin-permission-grid">{permissions.map((permission) => <label key={permission.PerM_id} className="admin-permission-option"><input type="checkbox" checked={selectedPermissionIds.has(Number(permission.PerM_id))} onChange={(event) => togglePermission(permission.PerM_id, event.target.checked)} /><span>{permission.PerM_nombre}</span></label>)}</div>}
        </section>}
      </>}
      {system === 'permissions' && <Field label="Nombre del permiso" value={form.nombre} onChange={(v) => updateForm('nombre', v)} required maxLength={50} />}
      {system === 'insurers' && <div className="admin-form-grid">
        <Field label="Nombre de la aseguradora" value={form.nombre} onChange={(v) => updateForm('nombre', v)} required maxLength={100} />
        <Field label="RFC" value={form.rfc} onChange={(v) => updateForm('rfc', v.toUpperCase())} required minLength={12} maxLength={13} />
        <Field label="Teléfono" value={form.telefono} onChange={(v) => updateForm('telefono', v)} required maxLength={13} />
        <label className="admin-form-field is-full"><span>Dirección *</span><textarea value={form.direccion} onChange={(event) => updateForm('direccion', event.target.value)} required maxLength={150} rows={3} /></label>
      </div>}
      {error && <div className="workspace-error admin-form-error"><AlertCircle size={16} /><span>{error}</span></div>}
      <div className="admin-editor-footer"><button type="button" className="admin-secondary-button" disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className="workspace-primary-button" disabled={busy || isSystemRole || editor.assignmentsLoading || editor.permissionsLoading || Boolean(editor.assignmentsError || editor.permissionsError)}>{busy ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear registro'}</button></div>
    </form>
  </Modal>;
}

function DeleteConfirmation({ registry, item, busy, error, onClose, onConfirm }) {
  if (!item) return null;
  const name = registry.system === 'users'
    ? [item.Usu_nombres, item.Usu_ap_paterno, item.Usu_ap_materno].filter(Boolean).join(' ')
    : registry.system === 'roles' ? item.Rol_nombre
      : registry.system === 'permissions' ? item.PerM_nombre : item.Ase_nombre;
  return <Modal title={`Eliminar ${registry.singular}`} subtitle="Esta acción no se puede deshacer." onClose={onClose}>
    <div className="admin-delete-details"><strong>{name}</strong><span>ID: {item[registry.idKey]}</span>{registry.system === 'users' && <small>Se borrará la cuenta, sus asignaciones de empresa y sus sesiones de acceso.</small>}</div>
    {error && <div className="workspace-error admin-form-error"><AlertCircle size={16} /><span>{error}</span></div>}
    <div className="admin-editor-footer"><button type="button" className="admin-secondary-button" disabled={busy} onClick={onClose}>Cancelar</button><button type="button" className="admin-danger-button" disabled={busy} onClick={onConfirm}>{busy ? 'Eliminando…' : 'Eliminar definitivamente'}</button></div>
  </Modal>;
}

export default function AdminDirectoryPage({ fixedDirectoryKey = null } = {}) {
  const navigate = useNavigate();
  const { directoryKey: routeDirectoryKey } = useParams();
  const directoryKey = fixedDirectoryKey || routeDirectoryKey;
  // Alias de la clave de ruta que se usa abajo para el texto y configuración visual.
  const registryKey = directoryKey;
  const { isAdminGlobal, user, companies } = useAuth();
  const registry = REGISTRIES[directoryKey];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(EMPTY_PAGE);
  const [editor, setEditor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [operationError, setOperationError] = useState('');
  const [toast, setToast] = useState('');
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);

  const load = useCallback(async (signal) => {
    if (!registry) { setLoading(false); return; }
    setLoading(true); setLoadError('');
    try {
      const result = await getRegistryPage(registry.endpoint, { page, limit: 20 }, { signal, company: false });
      setItems(result.items); setPagination(result.pagination);
    } catch (error) {
      if (error.name !== 'AbortError') setLoadError(error.message || 'No fue posible cargar los registros.');
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [registry, page]);

  useEffect(() => {
    const controller = new AbortController(); load(controller.signal); return () => controller.abort();
  }, [load]);

  useEffect(() => {
    if (!isAdminGlobal || directoryKey !== 'usuarios' && directoryKey !== 'roles') return;
    const controller = new AbortController();
    Promise.all([
      getRegistryPage('/roles', { page: 1, limit: 100 }, { signal: controller.signal, company: false }).then((result) => result.items),
      getRegistryPage('/permisos', { page: 1, limit: 250 }, { signal: controller.signal, company: false }).then((result) => result.items),
    ]).then(([roleRows, permissionRows]) => {
      if (!controller.signal.aborted) { setRoles(roleRows); setPermissions(permissionRows); }
    }).catch(() => { if (!controller.signal.aborted) { setRoles([]); setPermissions([]); } });
    return () => controller.abort();
  }, [isAdminGlobal, directoryKey]);

  const openCreate = () => {
    setOperationError('');
    setEditor({ mode: 'create', item: null, form: getForm(registry.system), assignmentRows: [], originalAssignments: [], permissionIds: [], originalPermissionIds: [], assignmentsLoading: false, permissionsLoading: false });
  };

  async function openEdit(row) {
    setOperationError('');
    const state = { mode: 'edit', item: row, form: getForm(registry.system, row), assignmentRows: [], originalAssignments: [], permissionIds: [], originalPermissionIds: [], assignmentsLoading: registry.system === 'users', permissionsLoading: registry.system === 'roles' };
    setEditor(state);
    if (registry.system === 'users') {
      try {
        const result = await getRegistryPage('/usuarios-empresas', { usuarioId: row.Usu_id, page: 1, limit: 100 }, { company: false });
        const assignments = result.items.map((item) => ({ empresaId: String(item.UE_empresa), rolId: String(item.UE_rol), originalEmpresaId: Number(item.UE_empresa), originalRolId: Number(item.UE_rol) }));
        setEditor((current) => current?.item?.Usu_id === row.Usu_id ? { ...current, assignmentRows: assignments, originalAssignments: assignments.map((assignment) => ({ ...assignment })), assignmentsLoading: false } : current);
      } catch (error) {
        setEditor((current) => current?.item?.Usu_id === row.Usu_id ? { ...current, assignmentsLoading: false, assignmentsError: error.message || 'No se pudieron consultar las asignaciones.' } : current);
      }
    }
    if (registry.system === 'roles') {
      try {
        const result = await getRegistryPage(`/rol-permisos/rol/${row.Rol_id}`, { page: 1, limit: 250 }, { company: false });
        const ids = result.items.map((permission) => Number(permission.PerM_id ?? permission.RP_permiso ?? permission.permisoId)).filter(Number.isFinite);
        setEditor((current) => current?.item?.Rol_id === row.Rol_id ? { ...current, permissionIds: ids, originalPermissionIds: [...ids], permissionsLoading: false } : current);
      } catch (error) {
        setEditor((current) => current?.item?.Rol_id === row.Rol_id ? { ...current, permissionsLoading: false, permissionsError: error.message || 'No se pudieron consultar los permisos del rol.' } : current);
      }
    }
  }

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es-MX');
    if (!normalized) return items;
    return items.filter((row) => registry.columns.some((column) => {
      const value = column.value ? column.value(row) : row[column.key];
      return String(value ?? '').toLocaleLowerCase('es-MX').includes(normalized);
    }));
  }, [items, query, registry]);

  async function syncUserAssignments(userId, desiredRows, originalRows) {
    const incomplete = desiredRows.some((row) => Boolean(row.empresaId) !== Boolean(row.rolId));
    if (incomplete) throw new Error('Completa la empresa y el rol en cada asignación o elimina la fila incompleta.');
    const desired = desiredRows.filter((row) => row.empresaId && row.rolId).map((row) => ({ empresaId: Number(row.empresaId), rolId: Number(row.rolId) }));
    if (new Set(desired.map((row) => row.empresaId)).size !== desired.length) throw new Error('No puedes asignar más de un rol al mismo usuario dentro de una empresa.');
    const originalByCompany = new Map(originalRows.map((row) => [Number(row.empresaId), Number(row.rolId)]));
    const desiredByCompany = new Map(desired.map((row) => [row.empresaId, row.rolId]));
    for (const [empresaId] of originalByCompany) {
      if (!desiredByCompany.has(empresaId)) await apiRequest(`/usuarios-empresas/${userId}/${empresaId}`, { method: 'DELETE', company: false });
    }
    for (const [empresaId, rolId] of desiredByCompany) {
      if (!originalByCompany.has(empresaId)) {
        await apiRequest('/usuarios-empresas', { method: 'POST', company: false, body: JSON.stringify({ usuarioId: Number(userId), empresaId, rolId }) });
      } else if (originalByCompany.get(empresaId) !== rolId) {
        await apiRequest('/usuarios-empresas', { method: 'PUT', company: false, body: JSON.stringify({ usuarioId: Number(userId), empresaId, rolId }) });
      }
    }
  }

  async function syncRolePermissions(rolId, desiredIds, originalIds) {
    const original = new Set(originalIds.map(Number)); const desired = new Set(desiredIds.map(Number));
    for (const permissionId of original) if (!desired.has(permissionId)) await apiRequest(`/rol-permisos/${rolId}/${permissionId}`, { method: 'DELETE', company: false });
    for (const permissionId of desired) if (!original.has(permissionId)) await apiRequest('/rol-permisos', { method: 'POST', company: false, body: JSON.stringify({ rolId: Number(rolId), permisoId }) });
  }

  async function saveEditor(event) {
    event.preventDefault(); if (!editor || !registry) return;
    setBusy(true); setOperationError('');
    let partialNotice = '';
    try {
      let id = editor.item?.[registry.idKey];
      if (registry.system === 'users') {
        const { nuevaPassword, ...form } = editor.form;
        if (editor.mode === 'create') {
          const created = await apiRequest(registry.endpoint, { method: 'POST', company: false, body: JSON.stringify(form) });
          id = created?.Usu_id ?? created?.id;
          if (!id) throw new Error('El backend creó el registro, pero no devolvió su identificador. Verifica el listado antes de volver a intentar.');
          try { await syncUserAssignments(id, editor.assignmentRows, []); }
          catch (error) { partialNotice = `La cuenta se creó (ID ${id}), pero falló una asignación: ${error.message}`; }
        } else {
          const { password, ...editable } = form;
          if (!editor.profileSaved) {
            const fieldMap = { nombres: 'Usu_nombres', apPaterno: 'Usu_ap_paterno', apMaterno: 'Usu_ap_materno', telefono: 'Usu_telefono', correo: 'Usu_correo' };
            const patch = {};
            for (const [formKey, dbKey] of Object.entries(fieldMap)) {
              if (String(form[formKey] ?? '') !== String(editor.item?.[dbKey] ?? '')) {
                patch[formKey] = (formKey === 'apMaterno' || formKey === 'telefono') && !form[formKey] ? null : form[formKey];
              }
            }
            if (Object.keys(patch).length) await apiRequest(`${registry.endpoint}/${id}`, { method: 'PUT', company: false, body: JSON.stringify(patch) });
            setEditor((current) => current?.item?.Usu_id === id ? {
              ...current,
              profileSaved: true,
              item: { ...current.item, Usu_nombres: form.nombres, Usu_ap_paterno: form.apPaterno, Usu_ap_materno: form.apMaterno || null, Usu_telefono: form.telefono || null, Usu_correo: form.correo },
            } : current);
          }
          if (nuevaPassword) {
            await apiRequest(`${registry.endpoint}/${id}/cambiar-password-admin`, { method: 'POST', company: false, body: JSON.stringify({ nuevaPassword }) });
            setEditor((current) => current?.item?.Usu_id === id ? { ...current, form: { ...current.form, nuevaPassword: '' } } : current);
          }
          await syncUserAssignments(id, editor.assignmentRows, editor.originalAssignments || []);
        }
      } else if (registry.system === 'roles') {
        if (editor.mode === 'create') {
          const created = await apiRequest(registry.endpoint, { method: 'POST', company: false, body: JSON.stringify(editor.form) });
          id = created?.Rol_id ?? created?.id;
          if (!id) throw new Error('No se recibió el identificador del nuevo rol.');
          try { await syncRolePermissions(id, editor.permissionIds || [], []); }
          catch (error) { partialNotice = `El rol se creó (ID ${id}), pero falló la asignación de permisos: ${error.message}`; }
        } else {
          const roleIsSystem = editor.item?.Rol_nombre === GLOBAL_ROLE;
          if (!roleIsSystem) {
            if (!editor.roleNameSaved && editor.form.nombre !== editor.item?.Rol_nombre) {
              await apiRequest(`${registry.endpoint}/${id}`, { method: 'PUT', company: false, body: JSON.stringify(editor.form) });
              setEditor((current) => current?.item?.Rol_id === id ? { ...current, roleNameSaved: true, item: { ...current.item, Rol_nombre: editor.form.nombre } } : current);
            }
            await syncRolePermissions(id, editor.permissionIds || [], editor.originalPermissionIds || []);
          }
        }
      } else {
        if (editor.mode === 'create') await apiRequest(registry.endpoint, { method: 'POST', company: false, body: JSON.stringify(editor.form) });
        else await apiRequest(`${registry.endpoint}/${id}`, { method: 'PUT', company: false, body: JSON.stringify(editor.form) });
      }
      setEditor(null);
      setToast(partialNotice || (editor.mode === 'create' ? `${registry.singular} creado correctamente.` : `${registry.singular} actualizado correctamente.`));
      await load();
    } catch (error) {
      // Las operaciones compuestas constan de varias peticiones HTTP. Si alguna falla,
      // actualizamos la base de comparación desde el servidor y conservamos los cambios deseados.
      if (editor.mode === 'edit' && registry.system === 'users' && editor.item?.Usu_id) {
        try {
          const latest = await getRegistryPage('/usuarios-empresas', { usuarioId: editor.item.Usu_id, page: 1, limit: 100 }, { company: false });
          const baseline = latest.items.map((item) => ({ empresaId: String(item.UE_empresa), rolId: String(item.UE_rol), originalEmpresaId: Number(item.UE_empresa), originalRolId: Number(item.UE_rol) }));
          setEditor((current) => current?.item?.Usu_id === editor.item.Usu_id ? { ...current, originalAssignments: baseline } : current);
        } catch { /* Conserva el contexto del error original. */ }
      }
      if (editor.mode === 'edit' && registry.system === 'roles' && editor.item?.Rol_id) {
        try {
          const latest = await getRegistryPage(`/rol-permisos/rol/${editor.item.Rol_id}`, { page: 1, limit: 250 }, { company: false });
          const baseline = latest.items.map((item) => Number(item.PerM_id ?? item.RP_permiso ?? item.permisoId)).filter(Number.isFinite);
          setEditor((current) => current?.item?.Rol_id === editor.item.Rol_id ? { ...current, originalPermissionIds: baseline } : current);
        } catch { /* Conserva el contexto del error original. */ }
      }
      setOperationError(error.message || 'No se pudo guardar el registro. Verifica permisos y datos.');
    } finally { setBusy(false); }
  }

  async function deleteRecord() {
    if (!deleteTarget) return;
    setBusy(true); setOperationError('');
    try {
      const id = deleteTarget[registry.idKey];
      await apiRequest(`${registry.endpoint}/${id}`, { method: 'DELETE', company: false });
      setDeleteTarget(null); setToast(`${registry.singular} eliminado correctamente.`); await load();
    } catch (error) { setOperationError(error.message || 'No se pudo eliminar. Puede haber registros relacionados o faltar permisos para esta operación.'); }
    finally { setBusy(false); }
  }

  async function changeUserStatus(row) {
    const action = row.Usu_status === 'ACTIVO' ? 'desactivar' : 'reactivar';
    if (!window.confirm(`¿Deseas ${action} la cuenta ${row.Usu_correo}?`)) return;
    setBusy(true);
    try {
      await apiRequest(`/usuarios/${row.Usu_id}/${action}`, { method: 'PATCH', company: false });
      setToast(action === 'desactivar' ? 'Usuario desactivado; sus sesiones dejan de tener acceso.' : 'Usuario reactivado.'); await load();
    } catch (error) { setToast(error.message || 'No se pudo cambiar el estado del usuario.'); }
    finally { setBusy(false); }
  }

  if (!registry) return <Navigate to="/administracion" replace />;
  if (!isAdminGlobal) return <Navigate to="/app" replace />;
  const singular = registryKey === 'usuarios' ? 'usuario'
    : registryKey === 'roles' ? 'rol'
      : registryKey === 'permisos' ? 'permiso' : 'aseguradora';
  const registryForEditor = { ...registry, singular };
  const isCurrentUser = (row) => registry.system === 'users' && Number(row.Usu_id) === Number(user?.id);

  return (
    <WorkspaceLayout activeNav={registry.activeNav}>
      <section className="registry-heading admin-directory-heading">
        <button type="button" className="registry-back" onClick={() => navigate('/administracion')} aria-label="Volver"><ArrowLeft size={18} /></button>
        <div className="registry-heading-copy"><p className="registry-breadcrumb">Administración / {registry.title}</p><h1>{registry.title}</h1><p className="workspace-subtitle">{registry.subtitle}</p></div>
        <label className="registry-search"><Search size={16} /><input type="search" placeholder={`Buscar ${registry.title.toLowerCase()}…`} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label>
        <button type="button" className="workspace-primary-button admin-add-button" onClick={openCreate}><Plus size={16} /> Nuevo {singular}</button>
      </section>

      <div className="registry-panel">
        <div className="registry-panel-heading"><div>{registry.system === 'users' ? <Users size={17} /> : registry.system === 'roles' ? <Shield size={17} /> : registry.system === 'permissions' ? <KeyRound size={17} /> : <Building2 size={17} />}<strong>Registros de {registry.title.toLowerCase()}</strong></div><span>{loading ? 'Consultando…' : `${pagination.total} en total`}</span></div>
        {loadError && <div className="workspace-error"><AlertCircle size={18} /><span>{loadError}</span><button type="button" onClick={() => load()}>Reintentar</button></div>}
        {loading ? <div className="workspace-loading">Cargando información…</div> : !loadError && visibleItems.length === 0 ? <div className="workspace-empty-state"><Activity size={27} /><h2>Sin registros</h2><p>{query ? 'No se encontraron registros con ese criterio.' : 'Todavía no hay registros para mostrar.'}</p><button type="button" className="workspace-primary-button" onClick={openCreate}><Plus size={15} /> Crear el primero</button></div> : !loadError && <div className="registry-table-wrap"><table className="registry-table admin-registry-table"><thead><tr>{registry.columns.map((column) => <th key={column.label}>{column.label}</th>)}<th className="admin-actions-heading">Acciones</th></tr></thead><tbody>
          {visibleItems.map((row, index) => {
            const id = row[registry.idKey] ?? index;
            const protectedRole = registry.system === 'roles' && row.Rol_nombre === GLOBAL_ROLE;
            return <tr key={id}>
              {registry.columns.map((column) => { const value = column.value ? column.value(row) : row[column.key]; return <td key={column.label}>{column.badge ? <span className={`registry-status ${value === 'ACTIVO' ? '' : 'is-inactive'}`}>{value || '—'}</span> : value == null || value === '' ? '—' : String(value)}</td>; })}
              <td><div className="admin-row-actions">
                <button type="button" className="admin-icon-action" title="Editar" aria-label={`Editar ${singular} ${id}`} onClick={() => openEdit(row)} disabled={protectedRole}><Edit3 size={14} /></button>
                {registry.system === 'users' ? (
                  // El backend actual no expone DELETE /usuarios/:id; se usa la baja lógica que sí existe.
                  <button type="button" className={`admin-icon-action${row.Usu_status === 'ACTIVO' ? ' is-danger' : ' is-success'}`} title={row.Usu_status === 'ACTIVO' ? 'Desactivar cuenta' : 'Reactivar cuenta'} aria-label={row.Usu_status === 'ACTIVO' ? 'Desactivar usuario' : 'Reactivar usuario'} onClick={() => changeUserStatus(row)} disabled={busy || isCurrentUser(row)}>{row.Usu_status === 'ACTIVO' ? <Trash2 size={14} /> : <RefreshCw size={14} />}</button>
                ) : (
                  <button type="button" className="admin-icon-action is-danger" title="Eliminar" aria-label={`Eliminar ${singular} ${id}`} onClick={() => { setOperationError(''); setDeleteTarget(row); }} disabled={protectedRole}><Trash2 size={14} /></button>
                )}
              </div></td>
            </tr>;
          })}
        </tbody></table></div>}
        <footer className="registry-pagination"><span>Página {pagination.page || page} de {Math.max(1, pagination.totalPages || 1)}</span><div><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</button><button type="button" disabled={page >= (pagination.totalPages || 1) || loading} onClick={() => setPage((value) => value + 1)}>Siguiente</button></div></footer>
      </div>
      <p className="registry-muted-note">Los cambios se realizan mediante la API. La cuenta actual y el rol ADMIN_GLOBAL están protegidos contra eliminación o alteraciones que podrían bloquear el acceso global.</p>
      {toast && <div className="catalog-toast" role="status"><Check size={16} /><span>{toast}</span><button type="button" aria-label="Cerrar aviso" onClick={() => setToast('')}><X size={15} /></button></div>}
      {editor && <RegistryEditor registry={registryForEditor} editor={editor} setEditor={setEditor} companies={companies} roles={roles} permissions={permissions} busy={busy} error={operationError || editor.assignmentsError || editor.permissionsError || ''} onClose={() => { if (!busy) { setEditor(null); setOperationError(''); } }} onSubmit={saveEditor} />}
      <DeleteConfirmation registry={registryForEditor} item={deleteTarget} busy={busy} error={operationError} onClose={() => { if (!busy) { setDeleteTarget(null); setOperationError(''); } }} onConfirm={deleteRecord} />
    </WorkspaceLayout>
  );
}
