import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, ArrowLeft, Building2, Check, Edit3, Link2, Plus, RefreshCw, Search, Trash2, Users, X } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/apiClient';
import { getRegistryPage } from '../services/registryApi';

const PAGE_SIZE = 20;
const emptyForm = { usuarioId: '', empresaId: '', rolId: '' };

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

function AssignmentModal({ editor, setEditor, users, companies, roles, busy, error, onClose, onSubmit }) {
  if (!editor) return null;
  const editing = editor.mode === 'edit';
  const form = editor.form;
  const setField = (field, value) => setEditor((current) => ({ ...current, form: { ...current.form, [field]: value } }));
  return createPortal(
    <div className="workspace-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section className="workspace-modal admin-editor-modal" role="dialog" aria-modal="true" aria-labelledby="assignment-modal-title">
        <button className="workspace-modal-close" type="button" aria-label="Cerrar" disabled={busy} onClick={onClose}><X size={18} /></button>
        <div className="workspace-modal-icon"><Link2 size={19} /></div>
        <h2 id="assignment-modal-title">{editing ? 'Editar asignación' : 'Asignar empresa a usuario'}</h2>
        <p>{editing ? 'Cambia el rol que el usuario tiene dentro de esta empresa.' : 'Selecciona un usuario, una empresa y el rol que tendrá dentro de ella.'}</p>
        <form className="admin-editor-form" onSubmit={onSubmit}>
          <label className="admin-form-field"><span>Usuario *</span><select value={form.usuarioId} onChange={(event) => setField('usuarioId', event.target.value)} required disabled={editing || busy}>
            <option value="">Seleccionar usuario…</option>
            {users.map((user) => <option key={user.Usu_id} value={String(user.Usu_id)}>{[user.Usu_nombres, user.Usu_ap_paterno, user.Usu_ap_materno].filter(Boolean).join(' ')} · {user.Usu_correo}</option>)}
          </select></label>
          <label className="admin-form-field"><span>Empresa *</span><select value={form.empresaId} onChange={(event) => setField('empresaId', event.target.value)} required disabled={editing || busy}>
            <option value="">Seleccionar empresa…</option>
            {companies.map((company) => <option key={company.id} value={String(company.id)}>{company.name}</option>)}
          </select></label>
          <label className="admin-form-field"><span>Rol dentro de la empresa *</span><select value={form.rolId} onChange={(event) => setField('rolId', event.target.value)} required disabled={busy}>
            <option value="">Seleccionar rol…</option>
            {roles.map((role) => <option key={role.Rol_id} value={String(role.Rol_id)}>{role.Rol_nombre}</option>)}
          </select></label>
          {error && <div className="workspace-error admin-form-error"><AlertCircle size={16} /><span>{error}</span></div>}
          <div className="admin-editor-footer"><button type="button" className="admin-secondary-button" disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className="workspace-primary-button" disabled={busy || !users.length || !companies.length || !roles.length}>{busy ? 'Guardando…' : editing ? 'Guardar rol' : 'Asignar empresa'}</button></div>
        </form>
      </section>
    </div>,
    document.body,
  );
}

export default function UserCompanyAssignmentsPage() {
  const navigate = useNavigate();
  const { isAdminGlobal, companies } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [optionsError, setOptionsError] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [operationError, setOperationError] = useState('');
  const [toast, setToast] = useState('');

  const loadAssignments = useCallback(async (signal) => {
    setLoading(true);
    setLoadError('');
    try {
      const result = await getRegistryPage('/usuarios-empresas', { page, limit: PAGE_SIZE }, { signal, company: false });
      setAssignments(result.items);
      setPagination(result.pagination);
    } catch (error) {
      if (error.name !== 'AbortError') setLoadError(error.message || 'No se pudieron consultar las asignaciones.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const controller = new AbortController();
    loadAssignments(controller.signal);
    return () => controller.abort();
  }, [loadAssignments]);

  const loadOptions = useCallback(async (signal) => {
    setOptionsLoading(true);
    setOptionsError('');
    try {
      const [userRows, roleRows] = await Promise.all([
        getAllRows('/usuarios', signal),
        getAllRows('/roles', signal),
      ]);
      if (!signal?.aborted) {
        setUsers(userRows);
        setRoles(roleRows);
      }
    } catch (error) {
      if (!signal?.aborted) setOptionsError(error.message || 'No se pudieron cargar los usuarios y roles para los selectores.');
    } finally {
      if (!signal?.aborted) setOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadOptions(controller.signal);
    return () => controller.abort();
  }, [loadOptions]);

  const visibleRows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es-MX');
    if (!normalized) return assignments;
    return assignments.filter((row) => [row.Usu_nombres, row.Usu_ap_paterno, row.Usu_correo, row.Emp_nombre, row.Rol_nombre, row.UE_usuario, row.UE_empresa].some((value) => String(value ?? '').toLocaleLowerCase('es-MX').includes(normalized)));
  }, [assignments, query]);

  function openCreate() {
    setOperationError('');
    setEditor({ mode: 'create', form: { ...emptyForm } });
  }

  function openEdit(row) {
    setOperationError('');
    setEditor({ mode: 'edit', item: row, form: { usuarioId: String(row.UE_usuario), empresaId: String(row.UE_empresa), rolId: String(row.UE_rol) } });
  }

  async function saveAssignment(event) {
    event.preventDefault();
    if (!editor) return;
    setBusy(true);
    setOperationError('');
    try {
      const body = {
        usuarioId: Number(editor.form.usuarioId),
        empresaId: Number(editor.form.empresaId),
        rolId: Number(editor.form.rolId),
      };
      if (!body.usuarioId || !body.empresaId || !body.rolId) throw new Error('Selecciona usuario, empresa y rol.');
      await apiRequest('/usuarios-empresas', {
        method: editor.mode === 'create' ? 'POST' : 'PUT',
        company: false,
        body: JSON.stringify(body),
      });
      setEditor(null);
      setToast(editor.mode === 'create' ? 'Empresa asignada al usuario correctamente.' : 'Rol de la asignación actualizado.');
      await loadAssignments();
    } catch (error) {
      setOperationError(error.message || 'No se pudo guardar la asignación. Revisa si el usuario ya pertenece a esa empresa y tus permisos.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteAssignment(row) {
    const userName = [row.Usu_nombres, row.Usu_ap_paterno].filter(Boolean).join(' ') || row.Usu_correo || `Usuario ${row.UE_usuario}`;
    if (!window.confirm(`¿Quitar a ${userName} de la empresa ${row.Emp_nombre}? Esta acción elimina su asignación y rol en esa empresa.`)) return;
    setBusy(true);
    setOperationError('');
    try {
      await apiRequest(`/usuarios-empresas/${row.UE_usuario}/${row.UE_empresa}`, { method: 'DELETE', company: false });
      setToast('La asignación se eliminó correctamente.');
      await loadAssignments();
    } catch (error) {
      setToast(error.message || 'No se pudo eliminar la asignación.');
    } finally {
      setBusy(false);
    }
  }

  if (!isAdminGlobal) return <Navigate to="/app" replace />;

  return (
    <WorkspaceLayout activeNav="settings">
      <section className="registry-heading admin-directory-heading">
        <button type="button" className="registry-back" onClick={() => navigate('/administracion')} aria-label="Volver a Administración"><ArrowLeft size={18} /></button>
        <div className="registry-heading-copy"><p className="registry-breadcrumb">Administración / Asignaciones</p><h1>Asignar empresas a usuarios</h1><p className="workspace-subtitle">Define el acceso de cada usuario y su rol dentro de cada empresa.</p></div>
        <label className="registry-search"><Search size={16} /><input type="search" placeholder="Buscar usuario, empresa o rol…" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label>
        <button type="button" className="workspace-primary-button admin-add-button" onClick={openCreate}><Plus size={16} /> Nueva asignación</button>
      </section>

      {(optionsError || loadError) && <div className="workspace-error"><AlertCircle size={18} /><span>{loadError || optionsError}</span><button type="button" onClick={() => { const controller = new AbortController(); loadAssignments(controller.signal); loadOptions(controller.signal); }}>Reintentar</button></div>}
      {optionsLoading && <p className="registry-muted-note">Cargando usuarios y roles disponibles…</p>}
      <div className="registry-panel">
        <div className="registry-panel-heading"><div><Link2 size={17} /><strong>Asignaciones usuario–empresa–rol</strong></div><span>{loading ? 'Consultando…' : `${pagination.total} en total`}</span></div>
        {loading ? <div className="workspace-loading">Cargando asignaciones…</div> : !loadError && visibleRows.length === 0 ? <div className="workspace-empty-state"><Users size={27} /><h2>Sin asignaciones</h2><p>{query ? 'No se encontraron asignaciones para la búsqueda actual.' : 'Todavía no hay asignaciones visibles. Puedes crear una con “Nueva asignación”.'}</p></div> : !loadError && <div className="registry-table-wrap"><table className="registry-table admin-registry-table"><thead><tr><th>Usuario</th><th>Correo</th><th>Empresa</th><th>Rol</th><th>Acciones</th></tr></thead><tbody>
          {visibleRows.map((row) => <tr key={`${row.UE_usuario}-${row.UE_empresa}`}>
            <td>{[row.Usu_nombres, row.Usu_ap_paterno].filter(Boolean).join(' ') || `Usuario ${row.UE_usuario}`}</td>
            <td>{row.Usu_correo || '—'}</td>
            <td>{row.Emp_nombre || `Empresa ${row.UE_empresa}`}</td>
            <td><span className="registry-status">{row.Rol_nombre || `Rol ${row.UE_rol}`}</span></td>
            <td><div className="admin-row-actions"><button type="button" className="admin-icon-action" title="Cambiar rol" aria-label={`Editar asignación de ${row.Usu_correo || row.UE_usuario}`} onClick={() => openEdit(row)} disabled={busy}><Edit3 size={14} /></button><button type="button" className="admin-icon-action is-danger" title="Quitar asignación" aria-label={`Quitar asignación a ${row.Usu_correo || row.UE_usuario}`} onClick={() => deleteAssignment(row)} disabled={busy}><Trash2 size={14} /></button></div></td>
          </tr>)}
        </tbody></table></div>}
        <footer className="registry-pagination"><span>Página {pagination.page || page} de {Math.max(1, pagination.totalPages || 1)}</span><div><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>Anterior</button><button type="button" disabled={page >= (pagination.totalPages || 1) || loading} onClick={() => setPage((current) => current + 1)}>Siguiente</button></div></footer>
      </div>
      <p className="registry-muted-note">Las asignaciones usan el endpoint existente <code>/usuarios-empresas</code>. El backend decide si la operación está permitida y puede impedir asignaciones duplicadas o cambios que comprometan ADMIN_GLOBAL.</p>
      {toast && <div className="catalog-toast" role="status"><Check size={16} /><span>{toast}</span><button type="button" aria-label="Cerrar aviso" onClick={() => setToast('')}><X size={15} /></button></div>}
      <AssignmentModal editor={editor} setEditor={setEditor} users={users} companies={companies.filter((company) => company.id != null && company.scope !== 'global')} roles={roles} busy={busy || optionsLoading} error={operationError || optionsError} onClose={() => { if (!busy) { setEditor(null); setOperationError(''); } }} onSubmit={saveAssignment} />
    </WorkspaceLayout>
  );
}
