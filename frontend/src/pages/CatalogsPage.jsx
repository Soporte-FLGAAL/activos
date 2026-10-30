import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  Database,
  Grid2X2,
  Info,
  List,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/apiClient';
import { getRegistryPage } from '../services/registryApi';

const CATALOGS = [
  {
    key: 'combustible', title: 'Combustible', description: 'Combustibles utilizados por las unidades.', endpoint: '/catalogos/combustible',
    icon: Tag, tone: 'red', idKey: 'Com_id', valueKey: 'Com_nombre', payloadKey: 'nombre', maxLength: 30, singular: 'combustible',
  },
  {
    key: 'estado-unidad', title: 'Estados de Unidad', description: 'Estados operativos disponibles para una unidad.', endpoint: '/catalogos/estado-unidad',
    icon: ShieldAlert, tone: 'wine', idKey: 'EsU_id', valueKey: 'EsU_estado', payloadKey: 'estado', maxLength: 20, singular: 'estado',
  },
  {
    key: 'periodos', title: 'Periodos', description: 'Periodos para las verificaciones vehiculares.', endpoint: '/catalogos/periodos',
    icon: Database, tone: 'gray', idKey: 'Per_id', valueKey: 'Per_nombre', payloadKey: 'nombre', maxLength: 15, singular: 'periodo',
  },
  {
    key: 'tipo-movimiento-placa', title: 'Tipos de Movimiento de Placas', description: 'Movimientos disponibles para el control de placas.', endpoint: '/catalogos/tipo-movimiento-placa',
    icon: Database, tone: 'charcoal', idKey: 'TpMP_id', valueKey: 'TpMP_nombre', payloadKey: 'nombre', maxLength: 20, singular: 'tipo de movimiento',
  },
  {
    key: 'tipo-poliza', title: 'Tipos de Póliza', description: 'Clasificación de las pólizas de seguro.', endpoint: '/catalogos/tipo-poliza',
    icon: Database, tone: 'red', idKey: 'TpP_id', valueKey: 'TpP_nombre', payloadKey: 'nombre', maxLength: 30, singular: 'tipo de póliza',
  },
  {
    key: 'tipo-tarjeta', title: 'Tipos de Tarjeta', description: 'Clasificación de tarjetas de circulación.', endpoint: '/catalogos/tipo-tarjeta',
    icon: Database, tone: 'wine', idKey: 'TpT_id', valueKey: 'TpT_nombre', payloadKey: 'nombre', maxLength: 20, singular: 'tipo de tarjeta',
  },
  {
    key: 'tipo-unidad', title: 'Tipos de Unidad', description: 'Cajas, Dolly, Tanques, Portas y otros tipos registrados.', endpoint: '/catalogos/tipo-unidad',
    icon: Database, tone: 'gray', idKey: 'TpU_id', valueKey: 'TpU_nombre', secondaryKey: 'TpU_nombre_corto', payloadKey: 'nombre', secondaryPayloadKey: 'nombreCorto', maxLength: 30, secondaryMaxLength: 15, singular: 'tipo de unidad',
  },
];

const EMPTY_CATALOG = { items: [], total: 0, status: 'loading', error: '' };

function CatalogEditor({ config, initialItem, busy, error, onClose, onSave }) {
  const editing = Boolean(initialItem);
  const [value, setValue] = useState(initialItem?.[config.valueKey] || '');
  const [secondary, setSecondary] = useState(initialItem?.[config.secondaryKey] || '');
  const [submitError, setSubmitError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (!value.trim()) {
      setSubmitError(`Escribe el nombre del ${config.singular}.`);
      return;
    }
    setSubmitError('');
    await onSave({
      [config.payloadKey]: value.trim(),
      ...(config.secondaryKey && secondary.trim() ? { [config.secondaryPayloadKey]: secondary.trim() } : {}),
    });
  }

  return (
    <div className="workspace-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <form className="workspace-modal catalog-editor-modal" role="dialog" aria-modal="true" aria-labelledby="catalog-editor-title" onSubmit={submit}>
        <button className="workspace-modal-close" type="button" aria-label="Cerrar" disabled={busy} onClick={onClose}><X size={18} /></button>
        <div className="workspace-modal-icon"><Database size={20} /></div>
        <p className="workspace-eyebrow">CATÁLOGOS DEL SISTEMA</p>
        <h2 id="catalog-editor-title">{editing ? 'Editar registro' : 'Agregar registro'}</h2>
        <p>{editing ? `Actualiza el nombre del registro seleccionado en ${config.title}.` : `Registra un nuevo elemento en ${config.title}.`}</p>
        <label className="company-form-label">Nombre<input autoFocus maxLength={config.maxLength} required value={value} onChange={(event) => setValue(event.target.value)} placeholder={`Nombre de ${config.singular}`} /></label>
        {config.secondaryKey && <label className="company-form-label">Nombre corto<input maxLength={config.secondaryMaxLength} value={secondary} onChange={(event) => setSecondary(event.target.value)} placeholder="Opcional" /></label>}
        {(submitError || error) && <div className="workspace-error" role="alert"><AlertCircle size={16} />{submitError || error}</div>}
        <div className="company-form-actions"><button type="button" className="workspace-secondary-button" disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className="workspace-primary-button" disabled={busy}>{busy ? <><LoaderCircle size={15} className="spin" /> Guardando…</> : <><Check size={15} /> Guardar</>}</button></div>
      </form>
    </div>
  );
}

function DeleteCatalogDialog({ config, item, busy, error, onClose, onConfirm }) {
  if (!item) return null;
  return (
    <div className="workspace-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section className="workspace-modal" role="dialog" aria-modal="true" aria-labelledby="catalog-delete-title">
        <button className="workspace-modal-close" type="button" aria-label="Cerrar" disabled={busy} onClick={onClose}><X size={18} /></button>
        <div className="workspace-modal-icon"><Trash2 size={20} /></div>
        <h2 id="catalog-delete-title">Eliminar registro</h2>
        <p>¿Deseas eliminar <strong>{item[config.valueKey]}</strong> de {config.title}? La base de datos puede rechazar la operación si el registro está siendo utilizado.</p>
        {error && <div className="workspace-error" role="alert"><AlertCircle size={16} />{error}</div>}
        <div className="company-form-actions"><button type="button" className="workspace-secondary-button" disabled={busy} onClick={onClose}>Cancelar</button><button type="button" className="workspace-danger-button" disabled={busy} onClick={onConfirm}>{busy ? 'Eliminando…' : 'Eliminar registro'}</button></div>
      </section>
    </div>
  );
}

function CatalogCard({ config, catalog, expanded, onToggle, onAdd, onEdit, onDelete, onOpen, canCreate, canEdit, canDelete }) {
  const Icon = config.icon;
  const entries = catalog.items.slice(0, 5);
  return (
    <article className={`catalog-admin-card tone-${config.tone}${expanded ? ' is-expanded' : ''}`}>
      <div className={`catalog-admin-cover tone-${config.tone}`}>
        <span className="catalog-admin-icon"><Icon size={22} strokeWidth={1.8} /></span>
        <div className="catalog-admin-cover-copy"><h2>{config.title}</h2><span>{catalog.status === 'ready' ? `${catalog.total} ${catalog.total === 1 ? 'registro' : 'registros'}` : catalog.status === 'loading' ? 'Consultando…' : 'No disponible'}</span></div>
        <button type="button" className="catalog-cover-open" onClick={onOpen} title={`Abrir catálogo ${config.title}`} aria-label={`Abrir catálogo ${config.title}`}><ArrowUpRight size={18} /></button>
      </div>
      <div className="catalog-admin-body">
        <div className="catalog-admin-actions">
          <div className="catalog-icon-actions" aria-label={`Acciones de ${config.title}`}>
            {canCreate && <button type="button" title={`Agregar ${config.singular}`} aria-label={`Agregar ${config.singular}`} onClick={onAdd}><Plus size={15} /></button>}
            {canCreate && (canEdit || canDelete) && <span />}
            {canEdit && <button type="button" title="Editar el primer registro" aria-label={`Editar el primer registro de ${config.title}`} onClick={() => entries[0] && onEdit(entries[0])} disabled={catalog.status !== 'ready' || entries.length === 0}><Pencil size={14} /></button>}
            {canEdit && canDelete && <span />}
            {canDelete && <button type="button" title="Eliminar el primer registro" aria-label={`Eliminar el primer registro de ${config.title}`} onClick={() => entries[0] && onDelete(entries[0])} disabled={catalog.status !== 'ready' || entries.length === 0}><Trash2 size={14} /></button>}
          </div>
          <button type="button" className="catalog-expand-button" onClick={onToggle} aria-expanded={expanded}>
            <Info size={14} /> {expanded ? 'Ocultar tipos' : 'Ver tipos'} {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
        {expanded && <div className="catalog-preview-panel">
          <div className="catalog-preview-heading"><span>REGISTROS</span><button type="button" onClick={onOpen}>Ver todos <ArrowUpRight size={13} /></button></div>
          {catalog.status === 'loading' ? <p className="catalog-preview-state"><LoaderCircle size={14} className="spin" /> Cargando catálogo…</p> : catalog.status === 'error' ? <p className="catalog-preview-state is-error"><AlertCircle size={14} /> {catalog.error}</p> : entries.length ? <ul className="catalog-chip-list">{entries.map((item) => <li key={item[config.idKey]}><span>{item[config.valueKey] || 'Sin nombre'}</span>{config.secondaryKey && item[config.secondaryKey] && <small>{item[config.secondaryKey]}</small>}{(canEdit || canDelete) && <div>{canEdit && <button type="button" title="Editar" aria-label={`Editar ${item[config.valueKey]}`} onClick={() => onEdit(item)}><Pencil size={12} /></button>}{canDelete && <button type="button" title="Eliminar" aria-label={`Eliminar ${item[config.valueKey]}`} onClick={() => onDelete(item)}><Trash2 size={12} /></button>}</div>}</li>)}</ul> : <p className="catalog-preview-state">Este catálogo aún no tiene registros.</p>}
          {catalog.status === 'ready' && catalog.total > 5 && <p className="catalog-more-note">Y {catalog.total - 5} registros más. <button type="button" onClick={onOpen}>Ver catálogo completo</button></p>}
        </div>}
        {!expanded && <div className="catalog-card-summary"><span><Database size={14} /> Datos compartidos del sistema</span><button type="button" onClick={onOpen}>Administrar <ArrowUpRight size={14} /></button></div>}
      </div>
    </article>
  );
}

export default function CatalogsPage() {
  const navigate = useNavigate();
  const { activeCompany, isAdminGlobal, can } = useAuth();
  const [catalogData, setCatalogData] = useState(() => Object.fromEntries(CATALOGS.map((catalog) => [catalog.key, { ...EMPTY_CATALOG }])));
  const [viewMode, setViewMode] = useState('grid');
  const [expandedKey, setExpandedKey] = useState('combustible');
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [operationError, setOperationError] = useState('');
  const [toast, setToast] = useState('');

  const loadCatalogs = useCallback(async (signal) => {
    if (!can('catalogos:ver') || (!isAdminGlobal && !activeCompany?.id)) return;
    const results = await Promise.all(CATALOGS.map(async (config) => {
      try {
        const page = await getRegistryPage(config.endpoint, { page: 1, limit: 5 }, { signal });
        return [config.key, { items: page.items, total: Number(page.pagination.total || 0), status: 'ready', error: '' }];
      } catch (error) {
        return [config.key, { items: [], total: 0, status: error.name === 'AbortError' ? 'loading' : 'error', error: error.message || 'No se pudo consultar este catálogo.' }];
      }
    }));
    if (!signal?.aborted) setCatalogData(Object.fromEntries(results));
  }, [activeCompany?.id, can, isAdminGlobal]);

  useEffect(() => {
    const controller = new AbortController();
    loadCatalogs(controller.signal);
    return () => controller.abort();
  }, [loadCatalogs]);

  useEffect(() => {
    function focusCatalogSearch(event) {
      const activeTag = document.activeElement?.tagName;
      if (event.key === '/' && !event.ctrlKey && !event.metaKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) {
        event.preventDefault();
        document.querySelector('.catalog-search input')?.focus();
      }
    }
    window.addEventListener('keydown', focusCatalogSearch);
    return () => window.removeEventListener('keydown', focusCatalogSearch);
  }, []);

  const visibleCatalogs = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es-MX');
    return CATALOGS.filter((config) => !query || `${config.title} ${config.description}`.toLocaleLowerCase('es-MX').includes(query));
  }, [search]);

  async function refreshCatalog(config) {
    try {
      const page = await getRegistryPage(config.endpoint, { page: 1, limit: 5 });
      setCatalogData((current) => ({ ...current, [config.key]: { items: page.items, total: Number(page.pagination.total || 0), status: 'ready', error: '' } }));
    } catch (error) {
      setCatalogData((current) => ({ ...current, [config.key]: { ...(current[config.key] || EMPTY_CATALOG), status: 'error', error: error.message || 'No se pudo actualizar la consulta.' } }));
    }
  }

  async function saveCatalog(payload) {
    const config = editor?.config;
    if (!config) return;
    setBusy(true);
    setOperationError('');
    try {
      if (editor.item) {
        await apiRequest(`${config.endpoint}/${encodeURIComponent(editor.item[config.idKey])}`, { method: 'PUT', body: JSON.stringify(payload) });
        setToast('El registro se actualizó correctamente.');
      } else {
        await apiRequest(config.endpoint, { method: 'POST', body: JSON.stringify(payload) });
        setToast('El registro se creó correctamente.');
      }
      setEditor(null);
      await refreshCatalog(config);
    } catch (error) {
      setOperationError(error.message || 'No se pudo guardar el registro. Verifica tus permisos y los datos enviados.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteCatalogItem() {
    if (!deleteTarget) return;
    const { config, item } = deleteTarget;
    setBusy(true);
    setOperationError('');
    try {
      await apiRequest(`${config.endpoint}/${encodeURIComponent(item[config.idKey])}`, { method: 'DELETE' });
      setDeleteTarget(null);
      setToast('El registro se eliminó correctamente.');
      await refreshCatalog(config);
    } catch (error) {
      setOperationError(error.message || 'No se pudo eliminar el registro. Es posible que tenga referencias relacionadas.');
    } finally {
      setBusy(false);
    }
  }

  const totalRecords = CATALOGS.reduce((total, config) => total + (catalogData[config.key]?.total || 0), 0);
  const anyLoading = CATALOGS.some((config) => catalogData[config.key]?.status === 'loading');
  const anyError = CATALOGS.some((config) => catalogData[config.key]?.status === 'error');
  const connectionLabel = anyLoading ? 'Consultando API' : anyError ? 'Revisar permisos o API' : 'API disponible';

  return (
    <WorkspaceLayout activeNav="catalogs">
      <section className="catalog-page-top">
        <div className="catalog-page-title">
          <div className="catalog-breadcrumb"><button type="button" onClick={() => navigate('/app')}>Panel Principal</button><ChevronDown size={14} className="breadcrumb-chevron" /><span>Catálogos del Sistema</span></div>
          <h1>Catálogos del Sistema</h1>
          <p className="workspace-subtitle">Administra los diferentes catálogos operativos de las flotillas.</p>
          <div className="catalog-stats"><span><Database size={14} /> {CATALOGS.length} catálogos</span><i /><span>{totalRecords.toLocaleString('es-MX')} registros consultados</span>{activeCompany && !isAdminGlobal && <><i /><span>Empresa: {activeCompany.name}</span></>}</div>
        </div>
        <div className="catalog-page-tools">
          <label className="catalog-search"><Search size={16} /><input type="search" placeholder="Buscar catálogo…" value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>/</kbd></label>
          <div className="workspace-view-toggle" aria-label="Vista de catálogos"><button type="button" className={viewMode === 'grid' ? 'is-selected' : ''} onClick={() => setViewMode('grid')}><Grid2X2 size={15} /> Grid</button><button type="button" className={viewMode === 'list' ? 'is-selected' : ''} onClick={() => setViewMode('list')}><List size={16} /> Lista</button></div>
        </div>
      </section>

      {(!isAdminGlobal && !activeCompany?.id) ? <div className="workspace-empty-state catalog-company-required"><Info size={28} /><h2>Selecciona una empresa</h2><p>Los catálogos son compartidos por todo el sistema. Selecciona una empresa para validar los permisos de tu rol.</p><button type="button" className="workspace-primary-button" onClick={() => navigate('/seleccionar-empresa', { state: { from: '/catalogos' } })}>Elegir empresa</button></div> : !can('catalogos:ver') ? <div className="workspace-empty-state catalog-company-required"><ShieldAlert size={28} /><h2>Sin permiso para consultar catálogos</h2><p>Tu rol no tiene asignado el permiso catalogos:ver en la empresa seleccionada.</p></div> : <>
        <div className="catalog-overview-strip"><div><span className="catalog-overview-icon"><Database size={18} /></span><span><strong>Datos operativos centralizados</strong><small>Los cambios se guardan en el backend y se validan con los permisos del usuario.</small></span></div><span className={`catalog-overview-status${anyError ? ' has-error' : ''}`}><span /> {connectionLabel}</span></div>
        <div className={`catalogs-grid catalog-admin-grid${viewMode === 'list' ? ' is-list' : ''}`}>
          {visibleCatalogs.map((config) => <CatalogCard key={config.key} config={config} catalog={catalogData[config.key] || EMPTY_CATALOG} expanded={expandedKey === config.key} onToggle={() => setExpandedKey((current) => current === config.key ? null : config.key)} canCreate={can('catalogos:crear')} canEdit={can('catalogos:editar')} canDelete={can('catalogos:eliminar')} onAdd={() => { setOperationError(''); setEditor({ config, item: null }); }} onEdit={(item) => { setOperationError(''); setEditor({ config, item }); }} onDelete={(item) => { setOperationError(''); setDeleteTarget({ config, item }); }} onOpen={() => navigate(`/catalogos/${config.key}`)} />)}
        </div>
        {visibleCatalogs.length === 0 && <div className="workspace-empty-state"><Search size={26} /><h2>No hay coincidencias</h2><p>Prueba con otro nombre de catálogo.</p></div>}
      </>}

      {toast && <div className="catalog-toast" role="status"><Check size={16} /><span>{toast}</span><button type="button" aria-label="Cerrar aviso" onClick={() => setToast('')}><X size={15} /></button></div>}
      {editor && <CatalogEditor config={editor.config} initialItem={editor.item} busy={busy} error={operationError} onClose={() => { if (!busy) { setEditor(null); setOperationError(''); } }} onSave={saveCatalog} />}
      <DeleteCatalogDialog config={deleteTarget?.config} item={deleteTarget?.item} busy={busy} error={operationError} onClose={() => { if (!busy) { setDeleteTarget(null); setOperationError(''); } }} onConfirm={deleteCatalogItem} />
    </WorkspaceLayout>
  );
}
