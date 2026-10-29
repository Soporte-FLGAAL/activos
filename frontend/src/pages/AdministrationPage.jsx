import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle, ArrowUpRight, Building2, Check, ChevronDown, ChevronUp, Database,
  Grid2X2, Info, KeyRound, List, LoaderCircle, Pencil, Plus,
  Shield, Trash2, Users, Workflow, X,
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/apiClient';
import { getRegistryCount, getRegistryPage } from '../services/registryApi';

const SYSTEM_ROLE = 'ADMIN_GLOBAL';
const INLINE_CATALOGS = {
  roles: {
    key: 'roles', title: 'Roles', detail: 'Roles de acceso disponibles en el sistema.',
    endpoint: '/roles', icon: Shield, tone: 'gray', idKey: 'Rol_id', valueKey: 'Rol_nombre', payloadKey: 'nombre', singular: 'rol',
  },
  permisos: {
    key: 'permisos', title: 'Permisos', detail: 'Acciones que pueden asignarse a cada rol.',
    endpoint: '/permisos', icon: KeyRound, tone: 'wine', idKey: 'PerM_id', valueKey: 'PerM_nombre', payloadKey: 'nombre', singular: 'permiso',
  },
};
const NAV_MODULES = [
  { key: 'usuarios', title: 'Usuarios', detail: 'Cuentas, empresas asignadas y roles de acceso.', endpoint: '/usuarios', icon: Users, tone: 'charcoal', countLabel: 'usuarios registrados', target: '/administracion/usuarios' },
  { key: 'aseguradoras', title: 'Aseguradoras', detail: 'Directorio de compañías y sus responsables.', endpoint: '/aseguradoras', icon: Building2, tone: 'red', countLabel: 'aseguradoras registradas', target: '/administracion/aseguradoras' },
  { key: 'rolPermisos', title: 'Roles y permisos', detail: 'Administra qué permisos tiene asignados cada rol.', cardSummary: 'Asignación de permisos por rol', icon: Workflow, tone: 'wine', target: '/administracion/rol-permisos' },
];
const EMPTY_DATA = { items: [], total: 0, status: 'loading', error: '' };

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

function CatalogEditor({ config, item, busy, error, onClose, onSave }) {
  const [name, setName] = useState(item?.[config.valueKey] || '');
  const editing = Boolean(item);
  const isSystemRole = config.key === 'roles' && item?.Rol_nombre === SYSTEM_ROLE;
  return (
    <div className="workspace-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <form className="workspace-modal catalog-editor-modal" role="dialog" aria-modal="true" aria-labelledby="admin-inline-editor-title" onSubmit={(event) => { event.preventDefault(); onSave({ [config.payloadKey]: name.trim() }); }}>
        <button className="workspace-modal-close" type="button" aria-label="Cerrar" disabled={busy} onClick={onClose}><X size={18} /></button>
        <div className="workspace-modal-icon"><Database size={20} /></div>
        <p className="workspace-eyebrow">ADMINISTRACIÓN</p>
        <h2 id="admin-inline-editor-title">{editing ? `Editar ${config.singular}` : `Agregar ${config.singular}`}</h2>
        <p>{editing ? `Actualiza el nombre del ${config.singular} seleccionado.` : `Registra un nuevo ${config.singular} en el sistema.`}</p>
        <label className="company-form-label">Nombre<input autoFocus required disabled={isSystemRole || busy} maxLength={config.key === 'roles' ? 20 : 50} value={name} onChange={(event) => setName(event.target.value)} placeholder={`Nombre de ${config.singular}`} /></label>
        {isSystemRole && <div className="admin-system-warning"><Shield size={16} /> El rol ADMIN_GLOBAL está protegido y no puede modificarse.</div>}
        {error && <div className="workspace-error" role="alert"><AlertCircle size={16} />{error}</div>}
        <div className="company-form-actions"><button type="button" className="workspace-secondary-button" disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className="workspace-primary-button" disabled={busy || isSystemRole || !name.trim()}>{busy ? <><LoaderCircle size={15} className="spin" /> Guardando…</> : <><Check size={15} /> Guardar</>}</button></div>
      </form>
    </div>
  );
}

function DeleteCatalogDialog({ config, item, busy, error, onClose, onConfirm }) {
  if (!item) return null;
  const name = item[config.valueKey] || config.singular;
  const isSystemRole = config.key === 'roles' && item.Rol_nombre === SYSTEM_ROLE;
  return (
    <div className="workspace-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section className="workspace-modal" role="dialog" aria-modal="true" aria-labelledby="admin-inline-delete-title">
        <button className="workspace-modal-close" type="button" aria-label="Cerrar" disabled={busy} onClick={onClose}><X size={18} /></button>
        <div className="workspace-modal-icon"><Trash2 size={20} /></div>
        <h2 id="admin-inline-delete-title">Eliminar {config.singular}</h2>
        <p>¿Seguro que deseas eliminar <strong>{name}</strong>? Esta acción no se puede deshacer.</p>
        {isSystemRole && <div className="admin-system-warning"><Shield size={16} /> El rol ADMIN_GLOBAL no se puede eliminar.</div>}
        {error && <div className="workspace-error" role="alert"><AlertCircle size={16} />{error}</div>}
        <div className="company-form-actions"><button type="button" className="workspace-secondary-button" disabled={busy} onClick={onClose}>Cancelar</button><button type="button" className="workspace-danger-button" disabled={busy || isSystemRole} onClick={onConfirm}>{busy ? 'Eliminando…' : 'Eliminar'}</button></div>
      </section>
    </div>
  );
}

function InlineCatalogCard({ config, catalog, expanded, onToggle, onAdd, onEdit, onDelete }) {
  const Icon = config.icon;
  const entries = catalog.items;
  const isRole = config.key === 'roles';
  return (
    <article className={`catalog-admin-card tone-${config.tone}${expanded ? ' is-expanded' : ''}`}>
      <div className={`catalog-admin-cover tone-${config.tone}`}>
        <span className="catalog-admin-icon"><Icon size={22} strokeWidth={1.8} /></span>
        <div className="catalog-admin-cover-copy"><h2>{config.title}</h2><span>{catalog.status === 'ready' ? `${catalog.total} ${catalog.total === 1 ? 'registro' : 'registros'}` : catalog.status === 'loading' ? 'Consultando…' : 'No disponible'}</span></div>
        <button type="button" className="catalog-cover-open" onClick={onToggle} title={expanded ? `Ocultar ${config.title}` : `Ver ${config.title}`} aria-label={expanded ? `Ocultar ${config.title}` : `Ver ${config.title}`} aria-expanded={expanded}>{expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>
      </div>
      <div className="catalog-admin-body">
        <div className="catalog-admin-actions">
          <div className="catalog-icon-actions" aria-label={`Acciones de ${config.title}`}>
            <button type="button" title={`Agregar ${config.singular}`} aria-label={`Agregar ${config.singular}`} onClick={onAdd}><Plus size={15} /></button>
            <span />
            <button type="button" title={`Editar primer ${config.singular}`} aria-label={`Editar primer ${config.singular}`} onClick={() => entries[0] && onEdit(entries[0])} disabled={catalog.status !== 'ready' || entries.length === 0 || (isRole && entries[0]?.Rol_nombre === SYSTEM_ROLE)}><Pencil size={14} /></button>
            <span />
            <button type="button" title={`Eliminar primer ${config.singular}`} aria-label={`Eliminar primer ${config.singular}`} onClick={() => entries[0] && onDelete(entries[0])} disabled={catalog.status !== 'ready' || entries.length === 0 || (isRole && entries[0]?.Rol_nombre === SYSTEM_ROLE)}><Trash2 size={14} /></button>
          </div>
          <button type="button" className="catalog-expand-button" onClick={onToggle} aria-expanded={expanded}><Info size={14} /> {expanded ? 'Ocultar registros' : 'Ver registros'} {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
        </div>
        {expanded && <div className="catalog-preview-panel">
          <div className="catalog-preview-heading"><span>REGISTROS</span><span>{catalog.status === 'ready' ? `${catalog.total} en total` : ''}</span></div>
          {catalog.status === 'loading' ? <p className="catalog-preview-state"><LoaderCircle size={14} className="spin" /> Cargando registros…</p> : catalog.status === 'error' ? <p className="catalog-preview-state is-error"><AlertCircle size={14} /> {catalog.error}</p> : entries.length ? <ul className="catalog-chip-list">{entries.map((item) => {
            const name = item[config.valueKey] || 'Sin nombre';
            const protectedRole = isRole && item.Rol_nombre === SYSTEM_ROLE;
            return <li key={item[config.idKey]}><span>{name}</span><div><button type="button" title="Editar" aria-label={`Editar ${name}`} disabled={protectedRole} onClick={() => onEdit(item)}><Pencil size={12} /></button><button type="button" title="Eliminar" aria-label={`Eliminar ${name}`} disabled={protectedRole} onClick={() => onDelete(item)}><Trash2 size={12} /></button></div></li>;
          })}</ul> : <p className="catalog-preview-state">Aún no hay {config.key === 'roles' ? 'roles' : 'permisos'} registrados.</p>}
          <div className="catalog-inline-add"><button type="button" className="workspace-primary-button" onClick={onAdd}><Plus size={14} /> Agregar {config.singular}</button></div>
        </div>}
        {!expanded && <div className="catalog-card-summary"><span><Database size={14} /> Administración centralizada</span><button type="button" onClick={onToggle}>Administrar <ChevronDown size={14} /></button></div>}
      </div>
    </article>
  );
}

function NavigationCard({ module, count, onOpen }) {
  const Icon = module.icon;
  return <article className={`catalog-admin-card tone-${module.tone}`}>
    <div className={`catalog-admin-cover tone-${module.tone}`}><span className="catalog-admin-icon"><Icon size={22} strokeWidth={1.8} /></span><div className="catalog-admin-cover-copy"><h2>{module.title}</h2><span>{module.cardSummary || (count?.status === 'ready' ? `${Number(count.value).toLocaleString('es-MX')} ${module.countLabel}` : count?.status === 'error' ? 'No disponible' : 'Consultando…')}</span></div><button type="button" className="catalog-cover-open" onClick={onOpen} aria-label={`Abrir ${module.title}`}><ArrowUpRight size={18} /></button></div>
    <div className="catalog-admin-body"><p className="catalog-admin-detail-copy">{module.detail}</p><div className="catalog-card-summary"><span><Database size={14} /> Gestión administrativa</span><button type="button" onClick={onOpen}>Administrar <ArrowUpRight size={14} /></button></div></div>
  </article>;
}

export default function AdministrationPage() {
  const navigate = useNavigate();
  const { isAdminGlobal } = useAuth();
  const [counts, setCounts] = useState({});
  const [catalogs, setCatalogs] = useState({ roles: { ...EMPTY_DATA }, permisos: { ...EMPTY_DATA } });
  const [viewMode, setViewMode] = useState('grid');
  const [expandedKey, setExpandedKey] = useState('roles');
  const [editor, setEditor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [operationError, setOperationError] = useState('');
  const [toast, setToast] = useState('');


  const loadInlineCatalog = useCallback(async (key, signal) => {
    const config = INLINE_CATALOGS[key];
    try {
      const items = await getAllRows(config.endpoint, signal);
      if (!signal?.aborted) setCatalogs((current) => ({ ...current, [key]: { items, total: items.length, status: 'ready', error: '' } }));
    } catch (error) {
      if (!signal?.aborted) setCatalogs((current) => ({ ...current, [key]: { ...(current[key] || EMPTY_DATA), status: 'error', error: error.message || `No se pudo consultar ${config.title}.` } }));
    }
  }, []);

  const loadData = useCallback(async (signal) => {
    const countModules = NAV_MODULES.filter((module) => module.endpoint);
    const countResults = await Promise.all(countModules.map(async (module) => {
      try { return [module.key, { value: await getRegistryCount(module.endpoint, { signal, company: false }), status: 'ready' }]; }
      catch { return [module.key, { value: null, status: 'error' }]; }
    }));
    if (!signal?.aborted) setCounts(Object.fromEntries(countResults));
    await Promise.all([loadInlineCatalog('roles', signal), loadInlineCatalog('permisos', signal)]);
  }, [loadInlineCatalog]);

  useEffect(() => {
    if (!isAdminGlobal) return undefined;
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [isAdminGlobal, loadData]);

  async function saveCatalog(payload) {
    const config = editor?.config;
    if (!config) return;
    setBusy(true); setOperationError('');
    try {
      if (editor.item) {
        await apiRequest(`${config.endpoint}/${encodeURIComponent(editor.item[config.idKey])}`, { method: 'PUT', company: false, body: JSON.stringify(payload) });
        setToast(`El ${config.singular} se actualizó correctamente.`);
      } else {
        await apiRequest(config.endpoint, { method: 'POST', company: false, body: JSON.stringify(payload) });
        setToast(`El ${config.singular} se creó correctamente.`);
      }
      setEditor(null);
      const ctrl = new AbortController();
      await loadInlineCatalog(config.key, ctrl.signal);
    } catch (error) {
      setOperationError(error.message || `No se pudo guardar el ${config.singular}.`);
    } finally { setBusy(false); }
  }

  async function deleteCatalogItem() {
    if (!deleteTarget) return;
    const { config, item } = deleteTarget;
    setBusy(true); setOperationError('');
    try {
      await apiRequest(`${config.endpoint}/${encodeURIComponent(item[config.idKey])}`, { method: 'DELETE', company: false });
      setDeleteTarget(null);
      setToast(`El ${config.singular} se eliminó correctamente.`);
      const ctrl = new AbortController();
      await loadInlineCatalog(config.key, ctrl.signal);
    } catch (error) {
      setOperationError(error.message || `No se pudo eliminar el ${config.singular}. Puede tener relaciones asociadas.`);
    } finally { setBusy(false); }
  }

  if (!isAdminGlobal) return <Navigate to="/app" replace />;

  return (
    <WorkspaceLayout activeNav="settings">
      <section className="admin-heading-row">
        <div><p className="admin-breadcrumb"><button type="button" onClick={() => navigate('/app')}>Panel Principal</button><span>›</span><strong>Administración</strong></p><h1>Administración</h1><p className="workspace-subtitle">Configuraciones globales del sistema.</p></div>
        <div className="workspace-view-toggle" aria-label="Vista de administración"><button type="button" className={viewMode === 'grid' ? 'is-selected' : ''} onClick={() => setViewMode('grid')}><Grid2X2 size={15} /> Grid</button><button type="button" className={viewMode === 'list' ? 'is-selected' : ''} onClick={() => setViewMode('list')}><List size={16} /> Lista</button></div>
      </section>

      <div className={`catalogs-grid catalog-admin-grid${viewMode === 'list' ? ' is-list' : ''}`}>
        {NAV_MODULES.map((module) => <NavigationCard key={module.key} module={module} count={counts[module.key]} onOpen={() => navigate(module.target)} />)}
        {Object.values(INLINE_CATALOGS).map((config) => <InlineCatalogCard key={config.key} config={config} catalog={catalogs[config.key] || EMPTY_DATA} expanded={expandedKey === config.key} onToggle={() => setExpandedKey((current) => current === config.key ? null : config.key)} onAdd={() => { setOperationError(''); setEditor({ config, item: null }); }} onEdit={(item) => { setOperationError(''); setEditor({ config, item }); }} onDelete={(item) => { setOperationError(''); setDeleteTarget({ config, item }); }} />)}
      </div>
      {toast && <div className="catalog-toast" role="status"><Check size={16} /><span>{toast}</span><button type="button" aria-label="Cerrar aviso" onClick={() => setToast('')}><X size={15} /></button></div>}
      {editor && <CatalogEditor config={editor.config} item={editor.item} busy={busy} error={operationError} onClose={() => { if (!busy) { setEditor(null); setOperationError(''); } }} onSave={saveCatalog} />}
      <DeleteCatalogDialog config={deleteTarget?.config} item={deleteTarget?.item} busy={busy} error={operationError} onClose={() => { if (!busy) { setDeleteTarget(null); setOperationError(''); } }} onConfirm={deleteCatalogItem} />
    </WorkspaceLayout>
  );
}
