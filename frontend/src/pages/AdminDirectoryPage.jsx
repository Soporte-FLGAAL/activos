import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Activity, AlertCircle, ArrowDown, ArrowDownUp, ArrowLeft, ArrowUp, Check, ChevronDown,
  Edit3, KeyRound, Plus, RefreshCw, Search, Shield, Trash2, Users, Building2, X,
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
      { label: 'Nombre', value: (row) => [row.Usu_nombres, row.Usu_ap_paterno, row.Usu_ap_materno].filter(Boolean).join(' ') },
      { label: 'Correo electrónico', key: 'Usu_correo' },
      { label: 'Empresas y roles', key: '_assignedRolesText' },
      { label: 'Teléfono', key: 'Usu_telefono' },
      { label: 'Estado', key: 'Usu_status', badge: true },
    ],
  },
  roles: {
    title: 'Roles', subtitle: 'Catálogo de roles de acceso disponibles en el sistema.', endpoint: '/roles', activeNav: 'settings', idKey: 'Rol_id', system: 'roles',
    columns: [{ label: 'ID', key: 'Rol_id' }, { label: 'Nombre del rol', key: 'Rol_nombre' }],
  },
  aseguradoras: {
    title: 'Aseguradoras', subtitle: 'Directorio de compañías aseguradoras.', endpoint: '/aseguradoras', activeNav: 'settings', idKey: 'Ase_id', system: 'insurers',
    columns: [
      { label: 'Aseguradora', key: 'Ase_nombre' }, { label: 'RFC', key: 'Ase_rfc' },
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
  return { nombre: row.Ase_nombre || '', rfc: row.Ase_rfc || '', telefono: row.Ase_telefono || '', direccion: row.Ase_direccion || '', responsables: [] };
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

function RegistryEditor({ registry, editor, setEditor, companies, roles, busy, error, onSubmit, onClose }) {
  const { system } = registry;
  const isEdit = editor.mode === 'edit';
  const form = editor.form;
  const isSystemRole = system === 'roles' && editor.item?.Rol_nombre === GLOBAL_ROLE;
  const updateForm = (name, value) => setEditor((current) => ({ ...current, form: { ...current.form, [name]: value } }));
  const responsibleRows = form.responsables || [];
  const updateResponsible = (index, patch) => updateForm('responsables', responsibleRows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));

  return <Modal title={isEdit ? `Editar ${registry.singular}` : `Nuevo ${registry.singular}`} subtitle={isEdit && system !== 'users' && system !== 'insurers' ? `ID de registro: ${editor.item?.[registry.idKey]}` : isEdit ? 'Actualiza los datos del registro seleccionado.' : 'Completa los campos y guarda los cambios.'} onClose={onClose} wide={system === 'users' || system === 'roles' || system === 'insurers'}>
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
        {isSystemRole && <div className="admin-system-warning"><Shield size={16} /> ADMIN_GLOBAL es un rol de sistema y no se puede modificar. Sus relaciones con permisos se protegen en el módulo Roles y permisos.</div>}
        {!isEdit && <p className="admin-field-hint">Después de crear el rol, usa la tarjeta “Roles y permisos” en Administración para asignarle sus permisos.</p>}
      </>}
      {system === 'permissions' && <Field label="Nombre del permiso" value={form.nombre} onChange={(v) => updateForm('nombre', v)} required maxLength={50} />}
      {system === 'insurers' && <>
        <div className="admin-form-grid">
          <Field label="Nombre de la aseguradora" value={form.nombre} onChange={(v) => updateForm('nombre', v)} required maxLength={100} />
          <Field label="RFC" value={form.rfc} onChange={(v) => updateForm('rfc', v.toUpperCase())} required minLength={12} maxLength={13} />
          <Field label="Teléfono" value={form.telefono} onChange={(v) => updateForm('telefono', v)} required maxLength={13} />
          <label className="admin-form-field is-full"><span>Dirección *</span><textarea value={form.direccion} onChange={(event) => updateForm('direccion', event.target.value)} required maxLength={150} rows={3} /></label>
        </div>
        {!isEdit && <section className="admin-responsibles-create-section">
          <div className="admin-assignment-heading"><div><Users size={16} /><strong>Responsables de la aseguradora</strong></div><button type="button" className="admin-secondary-button" onClick={() => updateForm('responsables', [...responsibleRows, { responsable: '', puestoResponsable: '', telefono: '', empresaResponsableId: '' }])}><Plus size={14} /> Agregar responsable</button></div>
          <p>Puedes registrar uno o varios responsables ahora, o agregarlos después desde el detalle de la aseguradora.</p>
          {responsibleRows.length === 0 ? <div className="admin-inline-empty">Sin responsables iniciales.</div> : responsibleRows.map((row, index) => <div className="admin-responsible-create-row" key={`initial-responsible-${index}`}>
            <div className="admin-form-grid">
              <Field label="Nombre del responsable" value={row.responsable} onChange={(v) => updateResponsible(index, { responsable: v })} maxLength={100} />
              <Field label="Puesto" value={row.puestoResponsable} onChange={(v) => updateResponsible(index, { puestoResponsable: v })} maxLength={50} />
              <Field label="Teléfono" value={row.telefono} onChange={(v) => updateResponsible(index, { telefono: v })} maxLength={13} />
              <label className="admin-form-field"><span>Empresa del responsable (opcional)</span><select value={row.empresaResponsableId} onChange={(event) => updateResponsible(index, { empresaResponsableId: event.target.value })}><option value="">Sin empresa asociada</option>{companies.map((company) => <option value={String(company.id)} key={company.id}>{company.name}</option>)}</select></label>
            </div>
            <button type="button" className="admin-icon-action is-danger admin-responsible-remove" aria-label={`Quitar responsable ${index + 1}`} title="Quitar responsable" onClick={() => updateForm('responsables', responsibleRows.filter((_, rowIndex) => rowIndex !== index))}><X size={15} /></button>
          </div>)}
        </section>}
      </>}
      {error && <div className="workspace-error admin-form-error"><AlertCircle size={16} /><span>{error}</span></div>}
      <div className="admin-editor-footer"><button type="button" className="admin-secondary-button" disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className="workspace-primary-button" disabled={busy || isSystemRole || editor.assignmentsLoading || Boolean(editor.assignmentsError)}>{busy ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear registro'}</button></div>
    </form>
  </Modal>;
}

function ResponsibleEditorModal({ editor, setEditor, companies, busy, error, onClose, onSubmit }) {
  if (!editor) return null;
  const form = editor.form;
  const setField = (field, value) => setEditor((current) => current ? ({ ...current, form: { ...current.form, [field]: value } }) : current);
  return <Modal title={editor.mode === 'edit' ? 'Editar responsable' : 'Agregar responsable'} subtitle={`Aseguradora: ${editor.aseguradora.Ase_nombre}`} onClose={onClose}>
    <form className="admin-editor-form" onSubmit={onSubmit}>
      <Field label="Nombre del responsable" value={form.responsable} onChange={(v) => setField('responsable', v)} required maxLength={100} />
      <Field label="Puesto" value={form.puestoResponsable} onChange={(v) => setField('puestoResponsable', v)} maxLength={50} />
      <Field label="Teléfono" value={form.telefono} onChange={(v) => setField('telefono', v)} required maxLength={13} />
      <label className="admin-form-field"><span>Empresa del responsable (opcional)</span><select value={form.empresaResponsableId ?? ''} onChange={(event) => setField('empresaResponsableId', event.target.value)}><option value="">Sin empresa asociada</option>{companies.map((company) => <option value={String(company.id)} key={company.id}>{company.name}</option>)}</select></label>
      {error && <div className="workspace-error admin-form-error"><AlertCircle size={16} /><span>{error}</span></div>}
      <div className="admin-editor-footer"><button type="button" className="admin-secondary-button" disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className="workspace-primary-button" disabled={busy}>{busy ? 'Guardando…' : editor.mode === 'edit' ? 'Guardar cambios' : 'Agregar responsable'}</button></div>
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
    <div className="admin-delete-details"><strong>{name}</strong>{!(['users', 'insurers'].includes(registry.system)) && <span>ID: {item[registry.idKey]}</span>}{registry.system === 'users' && <small>Se borrará la cuenta, sus asignaciones de empresa y sus sesiones de acceso.</small>}</div>
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
  const [assignmentLoadError, setAssignmentLoadError] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [expandedInsurerId, setExpandedInsurerId] = useState(null);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [responsiblesByInsurer, setResponsiblesByInsurer] = useState({});
  const [responsiblesLoading, setResponsiblesLoading] = useState({});
  const [responsibleEditor, setResponsibleEditor] = useState(null);
  const [responsibleBusy, setResponsibleBusy] = useState(false);
  const [responsibleError, setResponsibleError] = useState('');

  const clientSidePagination = Boolean(registry && ['users', 'insurers'].includes(registry.system));
  const apiPage = clientSidePagination ? 1 : page;
  const load = useCallback(async (signal) => {
    if (!registry) { setLoading(false); return; }
    setLoading(true); setLoadError('');
    if (registry.system === 'users') setAssignmentLoadError('');
    try {
      if (['users', 'insurers'].includes(registry.system)) {
        const allRows = [];
        let currentPage = 1;
        let totalPages = 1;
        do {
          const result = await getRegistryPage(registry.endpoint, { page: currentPage, limit: 100 }, { signal, company: false });
          allRows.push(...result.items);
          totalPages = Math.max(1, Number(result.pagination?.totalPages || 1));
          currentPage += 1;
        } while (currentPage <= totalPages && !signal?.aborted);
        if (registry.system === 'users') {
          try {
            const assignmentRows = [];
            let assignmentPage = 1;
            let assignmentTotalPages = 1;
            do {
              const assignmentsResult = await getRegistryPage('/usuarios-empresas', { page: assignmentPage, limit: 100 }, { signal, company: false });
              assignmentRows.push(...assignmentsResult.items);
              assignmentTotalPages = Math.max(1, Number(assignmentsResult.pagination?.totalPages || 1));
              assignmentPage += 1;
            } while (assignmentPage <= assignmentTotalPages && !signal?.aborted);

            const assignmentsByUser = new Map();
            for (const assignment of assignmentRows) {
              const userKey = String(assignment.UE_usuario);
              const group = assignmentsByUser.get(userKey) || [];
              group.push(assignment);
              assignmentsByUser.set(userKey, group);
            }
            const enrichedRows = allRows.map((row) => {
              const relations = assignmentsByUser.get(String(row.Usu_id)) || [];
              const rolePairs = [...new Map(relations.filter((item) => item.Emp_nombre || item.Rol_nombre).map((item) => [`${item.Emp_nombre || 'Empresa'}::${item.Rol_nombre || 'Sin rol'}`, { company: item.Emp_nombre || 'Empresa', role: item.Rol_nombre || 'Sin rol' }])).values()];
              return {
                ...row,
                _assignedRolePairs: rolePairs,
                _assignedRolesText: rolePairs.length ? rolePairs.map((item) => `${item.company}: ${item.role}`).join('; ') : 'Sin asignaciones',
              };
            });
            if (!signal?.aborted) setItems(enrichedRows);
          } catch (assignmentError) {
            if (signal?.aborted) return;
            setAssignmentLoadError(assignmentError.message || 'No se pudieron consultar las empresas y roles de los usuarios.');
            setItems(allRows.map((row) => ({ ...row, _assignedRolePairs: [], _assignedRolesText: 'No disponible' })));
          }
        } else {
          setItems(allRows);
        }
        setPagination({ page: 1, limit: 20, total: allRows.length, totalPages: Math.max(1, Math.ceil(allRows.length / 20)) });
      } else {
        const result = await getRegistryPage(registry.endpoint, { page: apiPage, limit: 20 }, { signal, company: false });
        setItems(result.items); setPagination(result.pagination);
      }
    } catch (error) {
      if (error.name !== 'AbortError') setLoadError(error.message || 'No fue posible cargar los registros.');
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [registry, apiPage]);

  useEffect(() => {
    const controller = new AbortController(); load(controller.signal); return () => controller.abort();
  }, [load]);

  useEffect(() => {
    if (!isAdminGlobal || directoryKey !== 'usuarios') return;
    const controller = new AbortController();
    getRegistryPage('/roles', { page: 1, limit: 100 }, { signal: controller.signal, company: false })
      .then((result) => { if (!controller.signal.aborted) setRoles(result.items); })
      .catch(() => { if (!controller.signal.aborted) setRoles([]); });
    return () => controller.abort();
  }, [isAdminGlobal, directoryKey]);

  const openCreate = () => {
    setOperationError('');
    setEditor({ mode: 'create', item: null, form: getForm(registry.system), assignmentRows: [], originalAssignments: [], assignmentsLoading: false });
  };

  async function openEdit(row) {
    setOperationError('');
    const state = { mode: 'edit', item: row, form: getForm(registry.system, row), assignmentRows: [], originalAssignments: [], assignmentsLoading: registry.system === 'users' };
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
  }

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es-MX');
    if (!normalized) return items;
    return items.filter((row) => registry.columns.some((column) => {
      const value = column.value ? column.value(row) : row[column.key];
      return String(value ?? '').toLocaleLowerCase('es-MX').includes(normalized);
    }));
  }, [items, query, registry]);

  const sortedVisibleItems = useMemo(() => {
    if (!sortConfig.key || !['users', 'insurers'].includes(registry.system)) return visibleItems;
    const column = registry.columns.find((item) => (item.key || item.label) === sortConfig.key);
    if (!column) return visibleItems;
    const collator = new Intl.Collator('es-MX', { numeric: true, sensitivity: 'base' });
    return [...visibleItems].sort((left, right) => {
      const leftValue = column.value ? column.value(left) : left[column.key];
      const rightValue = column.value ? column.value(right) : right[column.key];
      const comparison = collator.compare(String(leftValue ?? ''), String(rightValue ?? ''));
      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
  }, [visibleItems, sortConfig, registry]);

  const displayItems = clientSidePagination ? sortedVisibleItems.slice((page - 1) * 20, page * 20) : sortedVisibleItems;

  function toggleSort(column) {
    const key = column.key || column.label;
    setSortConfig((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }));
  }

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
          catch (error) { partialNotice = `La cuenta se creó, pero falló una asignación de empresa o rol: ${error.message}`; }
        } else {
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
      } else if (registry.system === 'insurers') {
        const { responsables = [], ...insurerData } = editor.form;
        if (editor.mode === 'create') {
          const preparedResponsibles = responsables.filter((row) => [row.responsable, row.puestoResponsable, row.telefono, row.empresaResponsableId].some((value) => String(value ?? '').trim() !== ''));
          const incomplete = preparedResponsibles.some((row) => !String(row.responsable || '').trim() || !String(row.telefono || '').trim());
          if (incomplete) throw new Error('Cada responsable que captures debe incluir nombre y teléfono. Completa esos campos o elimina la fila vacía.');
          const created = await apiRequest(registry.endpoint, { method: 'POST', company: false, body: JSON.stringify(insurerData) });
          id = created?.Ase_id ?? created?.aseguradoraId ?? created?.id;
          if (!id && preparedResponsibles.length) throw new Error('La aseguradora se creó, pero la API no devolvió su identificador para registrar los responsables.');
          if (id) {
            const responsibleErrors = [];
            for (const row of preparedResponsibles) {
              try {
                await apiRequest('/responsables-aseguradoras', {
                  method: 'POST', company: false,
                  body: JSON.stringify({
                    aseguradoraId: Number(id),
                    responsable: row.responsable.trim(),
                    puestoResponsable: row.puestoResponsable?.trim() || null,
                    telefono: row.telefono.trim(),
                    empresaResponsableId: row.empresaResponsableId ? Number(row.empresaResponsableId) : null,
                  }),
                });
              } catch (error) { responsibleErrors.push(`${row.responsable}: ${error.message}`); }
            }
            if (responsibleErrors.length) partialNotice = `La aseguradora se creó, pero hubo errores al registrar responsables: ${responsibleErrors.join(' · ')}`;
          }
        } else {
          await apiRequest(`${registry.endpoint}/${id}`, { method: 'PUT', company: false, body: JSON.stringify(insurerData) });
        }
      } else {
        if (editor.mode === 'create') await apiRequest(registry.endpoint, { method: 'POST', company: false, body: JSON.stringify(editor.form) });
        else await apiRequest(`${registry.endpoint}/${id}`, { method: 'PUT', company: false, body: JSON.stringify(editor.form) });
      }
      setEditor(null);
      setToast(partialNotice || (editor.mode === 'create' ? `${registry.singular} creado correctamente.` : `${registry.singular} actualizado correctamente.`));
      await load();
    } catch (error) {
      if (editor.mode === 'edit' && registry.system === 'users' && editor.item?.Usu_id) {
        try {
          const latest = await getRegistryPage('/usuarios-empresas', { usuarioId: editor.item.Usu_id, page: 1, limit: 100 }, { company: false });
          const baseline = latest.items.map((item) => ({ empresaId: String(item.UE_empresa), rolId: String(item.UE_rol), originalEmpresaId: Number(item.UE_empresa), originalRolId: Number(item.UE_rol) }));
          setEditor((current) => current?.item?.Usu_id === editor.item.Usu_id ? { ...current, originalAssignments: baseline } : current);
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

  async function loadResponsibles(aseguradoraId) {
    const key = String(aseguradoraId);
    setResponsiblesLoading((current) => ({ ...current, [key]: true }));
    try {
      const result = await getRegistryPage('/responsables-aseguradoras', { aseguradoraId, page: 1, limit: 100 }, { company: false });
      setResponsiblesByInsurer((current) => ({ ...current, [key]: result.items }));
      return result.items;
    } catch (error) {
      setToast(error.message || 'No se pudieron consultar los responsables de la aseguradora.');
      throw error;
    } finally {
      setResponsiblesLoading((current) => ({ ...current, [key]: false }));
    }
  }

  function toggleUserAssignments(row) {
    const id = Number(row.Usu_id);
    setExpandedUserId((current) => current === id ? null : id);
  }

  async function toggleInsurerDetails(row) {
    const id = Number(row.Ase_id);
    if (expandedInsurerId === id) {
      setExpandedInsurerId(null);
      return;
    }
    setExpandedInsurerId(id);
    if (!Object.prototype.hasOwnProperty.call(responsiblesByInsurer, String(id))) {
      try { await loadResponsibles(id); } catch { /* El error se muestra como aviso; la fila puede reintentarse al abrir. */ }
    }
  }

  function openResponsibleCreate(insurer) {
    setResponsibleError('');
    setResponsibleEditor({
      mode: 'create', insurer, item: null,
      form: { responsable: '', puestoResponsable: '', telefono: '', empresaResponsableId: '' },
    });
  }

  function openResponsibleEdit(insurer, row) {
    setResponsibleError('');
    setResponsibleEditor({
      mode: 'edit', insurer, item: row,
      form: {
        responsable: row.RA_responsable || '',
        puestoResponsable: row.RA_puesto_responsable || '',
        telefono: row.RA_telefono || '',
        empresaResponsableId: row.RA_empresa_responsable == null ? '' : String(row.RA_empresa_responsable),
      },
    });
  }

  async function saveResponsible(event) {
    event.preventDefault();
    if (!responsibleEditor) return;
    setResponsibleBusy(true); setResponsibleError('');
    const body = {
      aseguradoraId: Number(responsibleEditor.insurer.Ase_id),
      responsable: responsibleEditor.form.responsable.trim(),
      puestoResponsable: responsibleEditor.form.puestoResponsable.trim() || null,
      telefono: responsibleEditor.form.telefono.trim(),
      empresaResponsableId: responsibleEditor.form.empresaResponsableId ? Number(responsibleEditor.form.empresaResponsableId) : null,
    };
    try {
      await apiRequest(
        responsibleEditor.mode === 'edit' ? `/responsables-aseguradoras/${responsibleEditor.item.RA_id}` : '/responsables-aseguradoras',
        { method: responsibleEditor.mode === 'edit' ? 'PUT' : 'POST', company: false, body: JSON.stringify(body) },
      );
      const insurerId = Number(responsibleEditor.insurer.Ase_id);
      setResponsibleEditor(null);
      setToast(responsibleEditor.mode === 'edit' ? 'Responsable actualizado correctamente.' : 'Responsable agregado correctamente.');
      await loadResponsibles(insurerId);
    } catch (error) {
      setResponsibleError(error.message || 'No se pudo guardar el responsable.');
    } finally { setResponsibleBusy(false); }
  }

  async function deleteResponsible(insurer, row) {
    if (!window.confirm(`¿Eliminar al responsable ${row.RA_responsable} de ${insurer.Ase_nombre}?`)) return;
    setResponsibleBusy(true);
    try {
      await apiRequest(`/responsables-aseguradoras/${row.RA_id}`, { method: 'DELETE', company: false });
      setToast('Responsable eliminado correctamente.');
      await loadResponsibles(Number(insurer.Ase_id));
    } catch (error) { setToast(error.message || 'No se pudo eliminar el responsable.'); }
    finally { setResponsibleBusy(false); }
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
  const isCatalogStyle = registry.system === 'roles' || registry.system === 'permissions';
  const catalogName = (row) => registry.system === 'roles' ? row.Rol_nombre : row.PerM_nombre;

  return (
    <WorkspaceLayout activeNav={registry.activeNav}>
      <section className="registry-heading admin-directory-heading">
        <button type="button" className="registry-back" onClick={() => navigate('/administracion')} aria-label="Volver"><ArrowLeft size={18} /></button>
        <div className="registry-heading-copy"><p className="registry-breadcrumb">Administración / {registry.title}</p><h1>{registry.title}</h1><p className="workspace-subtitle">{registry.subtitle}</p></div>
        <label className="registry-search"><Search size={16} /><input type="search" placeholder={`Buscar ${registry.title.toLowerCase()}…`} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label>
        <button type="button" className="workspace-primary-button admin-add-button" onClick={openCreate}><Plus size={16} /> Nuevo {singular}</button>
      </section>

      <div className="registry-panel">
        <div className="registry-panel-heading"><div>{registry.system === 'users' ? <Users size={17} /> : registry.system === 'roles' ? <Shield size={17} /> : registry.system === 'permissions' ? <KeyRound size={17} /> : <Building2 size={17} />}<strong>{isCatalogStyle ? `Catálogo de ${registry.title.toLowerCase()}` : `Registros de ${registry.title.toLowerCase()}`}</strong></div><span>{loading ? 'Consultando…' : `${pagination.total} en total`}</span></div>
        {registry.system === 'users' && assignmentLoadError && <div className="admin-assignment-load-warning"><AlertCircle size={15} /><span>No se pudieron cargar las asignaciones de empresa y rol: {assignmentLoadError}</span></div>}
        {loadError && <div className="workspace-error"><AlertCircle size={18} /><span>{loadError}</span><button type="button" onClick={() => load()}>Reintentar</button></div>}
        {loading ? <div className="workspace-loading">Cargando información…</div> : !loadError && visibleItems.length === 0 ? <div className="workspace-empty-state"><Activity size={27} /><h2>Sin registros</h2><p>{query ? 'No se encontraron registros con ese criterio.' : 'Todavía no hay registros para mostrar.'}</p><button type="button" className="workspace-primary-button" onClick={openCreate}><Plus size={15} /> Crear el primero</button></div> : !loadError && isCatalogStyle ? <div className="admin-catalog-record-grid">
          {sortedVisibleItems.map((row) => {
            const id = row[registry.idKey];
            const protectedRole = registry.system === 'roles' && row.Rol_nombre === GLOBAL_ROLE;
            const Icon = registry.system === 'roles' ? Shield : KeyRound;
            return <article className={`admin-catalog-record-card ${registry.system === 'roles' ? 'tone-charcoal' : 'tone-wine'}`} key={id}>
              <span className="admin-catalog-record-icon"><Icon size={20} /></span>
              <div className="admin-catalog-record-copy"><span>{registry.system === 'roles' ? 'ROL DEL SISTEMA' : 'PERMISO DISPONIBLE'}</span><h2>{catalogName(row) || 'Sin nombre'}</h2>{protectedRole && <small>Protegido</small>}</div>
              <div className="admin-catalog-record-actions">
                <button type="button" className="admin-icon-action" title="Editar" aria-label={`Editar ${singular}`} onClick={() => openEdit(row)} disabled={protectedRole}><Edit3 size={14} /></button>
                <button type="button" className="admin-icon-action is-danger" title="Eliminar" aria-label={`Eliminar ${singular}`} onClick={() => { setOperationError(''); setDeleteTarget(row); }} disabled={protectedRole}><Trash2 size={14} /></button>
              </div>
            </article>;
          })}
        </div> : !loadError && <div className="registry-table-wrap"><table className="registry-table admin-registry-table"><thead><tr>{registry.columns.map((column) => {
            const sortable = ['users', 'insurers'].includes(registry.system);
            const key = column.key || column.label;
            const sorted = sortConfig.key === key;
            return <th key={column.label}>{sortable ? <button type="button" className="admin-sort-button" onClick={() => toggleSort(column)} aria-label={`Ordenar por ${column.label}`} aria-sort={sorted ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>{column.label}{sorted ? (sortConfig.direction === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowDownUp size={13} />}</button> : column.label}</th>;
          })}<th className="admin-actions-heading">Acciones</th></tr></thead><tbody>
          {displayItems.map((row, index) => {
            const id = row[registry.idKey] ?? index;
            const protectedRole = registry.system === 'roles' && row.Rol_nombre === GLOBAL_ROLE;
            const insurerId = Number(row.Ase_id);
            const insurerExpanded = registry.system === 'insurers' && expandedInsurerId === insurerId;
            const userExpanded = registry.system === 'users' && expandedUserId === Number(row.Usu_id);
            const userAssignments = row._assignedRolePairs || [];
            const responsibleRows = responsiblesByInsurer[String(insurerId)] || [];
            return <Fragment key={id}>
              <tr className={`${insurerExpanded ? 'admin-insurer-selected-row' : ''}${userExpanded ? ' admin-user-selected-row' : ''}`}>
                {registry.columns.map((column) => {
                  const value = column.value ? column.value(row) : row[column.key];
                  if (registry.system === 'insurers' && column.key === 'Ase_nombre') return <td key={column.label}><button type="button" className="admin-insurer-select" onClick={() => toggleInsurerDetails(row)} aria-expanded={insurerExpanded}>{value || '—'}<ChevronDown size={14} className={insurerExpanded ? 'is-open' : ''} /></button></td>;
                  if (registry.system === 'users' && column.key === '_assignedRolesText') {
                    const assignmentLabel = row._assignedRolesText === 'No disponible' ? 'No disponible' : userAssignments.length ? `${userAssignments.length} ${userAssignments.length === 1 ? 'asignación' : 'asignaciones'}` : 'Sin asignaciones';
                    return <td key={column.label}><button type="button" className={`admin-user-assignment-toggle${userExpanded ? ' is-open' : ''}`} onClick={() => toggleUserAssignments(row)} aria-expanded={userExpanded} aria-label={`${userExpanded ? 'Ocultar' : 'Ver'} empresas y roles de ${[row.Usu_nombres, row.Usu_ap_paterno, row.Usu_ap_materno].filter(Boolean).join(' ')}`}><span>{userExpanded ? 'Ocultar asignaciones' : `Ver asignaciones · ${assignmentLabel}`}</span><ChevronDown size={14} className={userExpanded ? 'is-open' : ''} /></button></td>;
                  }
                  return <td key={column.label}>{column.badge ? <span className={`registry-status ${value === 'ACTIVO' ? '' : 'is-inactive'}`}>{value || '—'}</span> : value == null || value === '' ? '—' : String(value)}</td>;
                })}
                <td><div className="admin-row-actions">
                  {registry.system === 'insurers' && <button type="button" className={`admin-icon-action${insurerExpanded ? ' is-selected' : ''}`} title={insurerExpanded ? 'Ocultar responsables' : 'Ver responsables'} aria-label={insurerExpanded ? 'Ocultar responsables' : 'Ver responsables'} onClick={() => toggleInsurerDetails(row)}><ChevronDown size={15} className={insurerExpanded ? 'is-open' : ''} /></button>}
                  <button type="button" className="admin-icon-action" title="Editar" aria-label={`Editar ${singular}`} onClick={() => openEdit(row)} disabled={protectedRole}><Edit3 size={14} /></button>
                  {registry.system === 'users' ? (
                    <button type="button" className={`admin-icon-action${row.Usu_status === 'ACTIVO' ? ' is-danger' : ' is-success'}`} title={row.Usu_status === 'ACTIVO' ? 'Desactivar cuenta' : 'Reactivar cuenta'} aria-label={row.Usu_status === 'ACTIVO' ? 'Desactivar usuario' : 'Reactivar usuario'} onClick={() => changeUserStatus(row)} disabled={busy || isCurrentUser(row)}>{row.Usu_status === 'ACTIVO' ? <Trash2 size={14} /> : <RefreshCw size={14} />}</button>
                  ) : <button type="button" className="admin-icon-action is-danger" title="Eliminar" aria-label={`Eliminar ${singular}`} onClick={() => { setOperationError(''); setDeleteTarget(row); }} disabled={protectedRole}><Trash2 size={14} /></button>}
                </div></td>
              </tr>
              {registry.system === 'users' && userExpanded && <tr className="admin-user-detail-row"><td colSpan={registry.columns.length + 1}>
                <section className="admin-user-assignments-detail">
                  <header className="admin-user-assignments-heading"><div><Building2 size={16} /><strong>Empresas y roles de {[row.Usu_nombres, row.Usu_ap_paterno, row.Usu_ap_materno].filter(Boolean).join(' ')}</strong><span>{userAssignments.length} {userAssignments.length === 1 ? 'asignación' : 'asignaciones'}</span></div></header>
                  {row._assignedRolesText === 'No disponible' ? <div className="admin-inline-empty">{assignmentLoadError || 'No se pudieron consultar las asignaciones de este usuario.'}</div> : userAssignments.length ? <div className="admin-user-role-list">{userAssignments.map((pair) => <span className="admin-user-role-chip" key={`${pair.company}-${pair.role}`} title={`${pair.company}: ${pair.role}`}><strong>{pair.company}</strong><small>{pair.role}</small></span>)}</div> : <div className="admin-inline-empty">Este usuario todavía no tiene empresas asignadas.</div>}
                </section>
              </td></tr>}
              {registry.system === 'insurers' && insurerExpanded && <tr className="admin-insurer-detail-row"><td colSpan={registry.columns.length + 1}>
                <section className="admin-insurer-responsibles">
                  <header className="admin-insurer-responsibles-heading"><div><Users size={17} /><strong>Responsables de {row.Ase_nombre}</strong><span>{responsiblesLoading[String(insurerId)] ? 'Consultando…' : `${responsibleRows.length} ${responsibleRows.length === 1 ? 'responsable' : 'responsables'}`}</span></div><button type="button" className="admin-secondary-button" onClick={() => openResponsibleCreate(row)}><Plus size={14} /> Añadir responsable</button></header>
                  {responsiblesLoading[String(insurerId)] ? <div className="admin-inline-loading">Cargando responsables…</div> : responsibleRows.length === 0 ? <div className="admin-inline-empty">Esta aseguradora todavía no tiene responsables. Usa “Añadir responsable” para registrar uno.</div> : <div className="registry-table-wrap"><table className="registry-table admin-responsible-table"><thead><tr><th>Responsable</th><th>Puesto</th><th>Teléfono</th><th>Empresa relacionada</th><th className="admin-actions-heading">Acciones</th></tr></thead><tbody>{responsibleRows.map((responsible) => <tr key={responsible.RA_id}><td>{responsible.RA_responsable || '—'}</td><td>{responsible.RA_puesto_responsable || '—'}</td><td>{responsible.RA_telefono || '—'}</td><td>{responsible.empresa_nombre || '—'}</td><td><div className="admin-row-actions"><button type="button" className="admin-icon-action" title="Editar responsable" aria-label="Editar responsable" onClick={() => openResponsibleEdit(row, responsible)}><Edit3 size={14} /></button><button type="button" className="admin-icon-action is-danger" title="Eliminar responsable" aria-label="Eliminar responsable" disabled={responsibleBusy} onClick={() => deleteResponsible(row, responsible)}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div>}
                </section>
              </td></tr>}
            </Fragment>;
          })}
        </tbody></table></div>}
        <footer className="registry-pagination"><span>Página {clientSidePagination ? page : (pagination.page || page)} de {Math.max(1, pagination.totalPages || 1)}</span><div><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</button><button type="button" disabled={page >= (pagination.totalPages || 1) || loading} onClick={() => setPage((value) => value + 1)}>Siguiente</button></div></footer>
      </div>
      <p className="registry-muted-note">{registry.system === 'users' ? 'Desde cada usuario puedes administrar todas sus empresas y roles, sin duplicar el directorio de usuarios en otra pantalla.' : registry.system === 'insurers' ? 'Selecciona una aseguradora para desplegar, agregar, editar o eliminar sus responsables asociados.' : isCatalogStyle ? 'Los roles y permisos usan un diseño de catálogo. Las relaciones entre ambos se administran desde el módulo “Roles y permisos”.' : 'Los cambios se realizan mediante la API. Las restricciones de sistema siguen aplicándose en el backend.'}</p>
      {toast && <div className="catalog-toast" role="status"><Check size={16} /><span>{toast}</span><button type="button" aria-label="Cerrar aviso" onClick={() => setToast('')}><X size={15} /></button></div>}
      {editor && <RegistryEditor registry={registryForEditor} editor={editor} setEditor={setEditor} companies={companies} roles={roles} busy={busy} error={operationError || editor.assignmentsError || ''} onClose={() => { if (!busy) { setEditor(null); setOperationError(''); } }} onSubmit={saveEditor} />}
      <DeleteConfirmation registry={registryForEditor} item={deleteTarget} busy={busy} error={operationError} onClose={() => { if (!busy) { setDeleteTarget(null); setOperationError(''); } }} onConfirm={deleteRecord} />
      {responsibleEditor && <ResponsibleEditorModal editor={responsibleEditor} setEditor={setResponsibleEditor} companies={companies} busy={responsibleBusy} error={responsibleError} onClose={() => { if (!responsibleBusy) { setResponsibleEditor(null); setResponsibleError(''); } }} onSubmit={saveResponsible} />}
    </WorkspaceLayout>
  );
}
