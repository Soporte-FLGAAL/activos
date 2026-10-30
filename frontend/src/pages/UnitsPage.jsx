import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Box, Building2, ChevronLeft, ChevronRight, ClipboardList, Filter, Hash, Pencil, Plus, Search, Shield, Trash2, Truck, X } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';
import { getCardsByUnitIds, getUnitTypes, getUnits } from '../services/fleetApi';

function unitId(unit) { return Number(unit?.Uni_id ?? unit?.id); }
function unitTypeId(unit) { return Number(unit?.Uni_tipo ?? unit?.tipoId); }
function unitStatus(unit) { return String(unit?.Uni_status ?? unit?.status ?? ''); }

function UnitCard({ unit, card, onOpen, onEdit, onDelete, canEdit, canDelete, deleting }) {
  const noEconomico = unit.Uni_no_economico || unit.Uni_id;
  return (
    <article className="unit-card">
      <button type="button" className="unit-card-open" onClick={onOpen} aria-label={`Ver detalle de la unidad ${noEconomico}`}>
        <div className="unit-card-heading">
          <span className="unit-card-icon"><Truck size={19} /></span>
          <strong>Unidad {noEconomico}</strong>
          <span className="unit-type-pill">{unit.tipo_nombre || 'Unidad'}</span>
        </div>
        <div className="unit-card-field"><span><Hash size={14} /> Placas</span><strong>{card?.Pla_placas || '—'}</strong></div>
        <div className="unit-card-field"><span><ClipboardList size={14} /> No. T.C.</span><strong>{card?.TC_tarjeta || '—'}</strong></div>
        <div className="unit-card-field"><span><Shield size={14} /> Propietario</span><strong title={unit.propietario_nombre || ''}>{unit.propietario_nombre || '—'}</strong></div>
        <div className="unit-card-field"><span><Box size={14} /> Marca</span><strong>{unit.Uni_marca || '—'}</strong></div>
        <div className="unit-card-field"><span><Box size={14} /> Modelo</span><strong>{unit.Uni_anio_modelo || unit.Uni_modelo || '—'}</strong></div>
        {unitStatus(unit) && <div className={`unit-status ${unitStatus(unit) === 'ALTA' ? 'is-active' : 'is-inactive'}`}>{unitStatus(unit) === 'ALTA' ? 'Activa' : 'Baja'}</div>}
      </button>
      {(canEdit || canDelete) && <div className="unit-card-actions">
        {canEdit && <button type="button" className="unit-card-action" onClick={onEdit}><Pencil size={14} /> Editar</button>}
        {canDelete && <button type="button" className="unit-card-action is-danger" onClick={onDelete} disabled={deleting}><Trash2 size={14} /> {deleting ? 'Eliminando…' : 'Eliminar'}</button>}
      </div>}
    </article>
  );
}

export default function UnitsPage() {
  const navigate = useNavigate();
  const { activeCompany, isAdminGlobal, can } = useAuth();
  const [units, setUnits] = useState([]);
  const [cardsByUnit, setCardsByUnit] = useState({});
  const [typeOptions, setTypeOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);
  const [error, setError] = useState('');
  const [typeError, setTypeError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [status, setStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState('grid');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadUnits = useCallback(async (signal) => {
    if (!activeCompany?.id && !isAdminGlobal) return;
    setLoading(true);
    setError('');
    const filters = { page, limit: 20 };
    if (debouncedSearch) filters.search = debouncedSearch;
    if (selectedType !== 'all') filters.tipoId = selectedType;
    if (status) filters.status = status;
    // El backend filtra por empresaId de query para ADMIN_GLOBAL; sin empresa activa consulta el ámbito global.
    if (isAdminGlobal && activeCompany?.id) filters.empresaId = activeCompany.id;
    try {
      const result = await getUnits(filters, { signal });
      setUnits(result.items);
      setPagination(result.pagination);
    } catch (requestError) {
      if (requestError.name !== 'AbortError') setError(requestError.message || 'No fue posible cargar las unidades.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [activeCompany?.id, isAdminGlobal, debouncedSearch, selectedType, status, page]);

  useEffect(() => {
    const controller = new AbortController();
    loadUnits(controller.signal);
    return () => controller.abort();
  }, [loadUnits]);

  useEffect(() => {
    if (!activeCompany?.id && !isAdminGlobal) return undefined;
    const controller = new AbortController();
    getUnitTypes({ signal: controller.signal })
      .then((items) => {
        setTypeOptions(items.map((row) => ({ id: String(row.TpU_id), name: row.TpU_nombre })));
        setTypeError('');
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setTypeError('No se pudieron consultar los tipos de unidad; puedes seguir usando la búsqueda.');
      });
    return () => controller.abort();
  }, [activeCompany?.id, isAdminGlobal]);

  useEffect(() => {
    if ((!activeCompany?.id && !isAdminGlobal) || !units.length) {
      setCardsByUnit({});
      return undefined;
    }
    const controller = new AbortController();
    let cancelled = false;
    setLoadingCards(true);
    getCardsByUnitIds(units.map(unitId), { signal: controller.signal })
      .then((cardsById) => {
        if (!cancelled) setCardsByUnit(Object.fromEntries(
          Object.entries(cardsById).map(([id, card]) => [Number(id), card]),
        ));
      })
      .catch((requestError) => {
        if (!cancelled && requestError.name !== 'AbortError') setCardsByUnit({});
      })
      .finally(() => {
        if (!cancelled) setLoadingCards(false);
      });
    return () => { cancelled = true; controller.abort(); };
  }, [activeCompany?.id, isAdminGlobal, units]);

  const derivedTypes = useMemo(() => {
    if (typeOptions.length) return typeOptions;
    const byId = new Map();
    units.forEach((unit) => {
      const id = unitTypeId(unit);
      if (id > 0) byId.set(String(id), { id: String(id), name: unit.tipo_nombre || `Tipo ${id}` });
    });
    return [...byId.values()];
  }, [typeOptions, units]);

  if (!activeCompany?.id && !isAdminGlobal) return <Navigate to="/seleccionar-empresa" replace state={{ from: '/unidades' }} />;

  async function handleDeleteUnit(unit) {
    const id = unitId(unit);
    const label = unit?.Uni_no_economico || id;
    const confirmed = window.confirm(`¿Eliminar la unidad ${label}? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    setDeletingId(id);
    setError('');
    try {
      const { deleteUnit } = await import('../services/fleetApi');
      await deleteUnit(id);
      setUnits((current) => current.filter((item) => unitId(item) !== id));
      setPagination((current) => ({
        ...current,
        total: Math.max(0, Number(current.total || 0) - 1),
        totalPages: Math.max(1, Math.ceil(Math.max(0, Number(current.total || 0) - 1) / current.limit)),
      }));
      await loadUnits();
    } catch (requestError) {
      setError(requestError.message || 'No fue posible eliminar la unidad.');
    } finally {
      setDeletingId(null);
    }
  }

  function selectType(value) {
    setSelectedType(value);
    setPage(1);
  }

  function clearFilters() {
    setSearch('');
    setSelectedType('all');
    setStatus('');
    setPage(1);
  }

  return (
    <WorkspaceLayout activeNav="units">
      <section className="units-heading-row">
        <div>
          <h1>Catálogo de Unidades</h1>
          <p className="workspace-subtitle">{activeCompany?.name || 'Todas las empresas'} · Gestiona los vehículos y remolques</p>
        </div>
        <div className="units-search-tools">
          {(isAdminGlobal || can('unidades:crear')) && <button type="button" className="units-add-button" onClick={() => navigate('/unidades/alta')}><Plus size={16} /> Añadir</button>}
          <label className="units-search"><Search size={17} /><input type="search" placeholder="Buscar unidad…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /><button type="button" aria-label="Limpiar búsqueda" onClick={() => setSearch('')} hidden={!search}><X size={14} /></button></label>
          <button type="button" className={`units-filter-button${showFilters ? ' is-active' : ''}`} onClick={() => setShowFilters((current) => !current)}><Filter size={16} /> Filtros</button>
          <button type="button" className="units-change-company" onClick={() => navigate('/app')} title="Volver al panel principal"><Building2 size={16} /></button>
        </div>
      </section>

      <div className="units-toolbar">
        <div className="unit-type-tabs" role="tablist" aria-label="Filtrar por tipo de unidad">
          <button type="button" role="tab" aria-selected={selectedType === 'all'} className={selectedType === 'all' ? 'is-selected' : ''} onClick={() => selectType('all')}>Todos</button>
          {derivedTypes.map((type) => <button type="button" role="tab" aria-selected={selectedType === type.id} className={selectedType === type.id ? 'is-selected' : ''} key={type.id} onClick={() => selectType(type.id)}>{type.name}</button>)}
        </div>
        <div className="units-view-switch" aria-label="Modo de visualización">
          <button type="button" className={view === 'grid' ? 'is-selected' : ''} onClick={() => setView('grid')} title="Cuadrícula"><span className="view-grid-glyph">▦</span></button>
          <button type="button" className={view === 'list' ? 'is-selected' : ''} onClick={() => setView('list')} title="Lista"><span className="view-list-glyph">☷</span></button>
        </div>
      </div>

      {showFilters && <section className="units-filter-panel">
        <label>Estado de unidad<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">Todos los estados</option><option value="ALTA">Activas (ALTA)</option><option value="BAJA">Baja</option></select></label>
        <button type="button" className="units-clear-filters" onClick={clearFilters}>Limpiar filtros</button>
      </section>}

      {typeError && <p className="registry-muted-note">{typeError}</p>}
      {error && <div className="workspace-error"><AlertCircle size={18} /><span>{error}</span><button type="button" onClick={() => loadUnits()}>Reintentar</button></div>}
      {loading ? <div className="workspace-loading">Cargando unidades…</div> : !error && units.length === 0 ? <div className="workspace-empty-state unit-empty"><Truck size={30} /><h2>No se encontraron unidades</h2><p>Prueba quitando filtros o verifica que existan unidades registradas para este ámbito.</p><button type="button" className="workspace-primary-button" onClick={clearFilters}>Limpiar búsqueda y filtros</button></div> : (
        <div className={`units-grid${view === 'list' ? ' is-list' : ''}`}>
          {units.map((unit) => <UnitCard
            key={unitId(unit)}
            unit={unit}
            card={cardsByUnit[unitId(unit)]}
            onOpen={() => navigate(`/unidades/${unitId(unit)}`)}
            onEdit={() => navigate(`/unidades/${unitId(unit)}/editar`)}
            onDelete={() => handleDeleteUnit(unit)}
            canEdit={isAdminGlobal || can('unidades:editar')}
            canDelete={isAdminGlobal || can('unidades:eliminar')}
            deleting={deletingId === unitId(unit)}
          />)}
        </div>
      )}

      <footer className="units-pagination">
        <span>{loadingCards ? 'Consultando tarjetas de circulación…' : (pagination.total ? `Mostrando ${Math.min((page - 1) * pagination.limit + 1, pagination.total)}–${Math.min(page * pagination.limit, pagination.total)} de ${pagination.total} unidades` : 'Sin registros')}</span>
        <div><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Página anterior"><ChevronLeft size={17} /></button><span>Página {page} de {Math.max(1, pagination.totalPages)}</span><button type="button" disabled={page >= (pagination.totalPages || 1) || loading} onClick={() => setPage((value) => value + 1)} aria-label="Página siguiente"><ChevronRight size={17} /></button></div>
      </footer>
    </WorkspaceLayout>
  );
}
