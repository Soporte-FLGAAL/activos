import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Box, ChevronLeft, ChevronRight, ClipboardList, Filter, Hash, Search, Shield, Truck, X } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';
import { getCirculationCards, getUnits } from '../services/fleetApi';

function unitId(unit) { return Number(unit?.Uni_id ?? unit?.id); }
function unitTypeId(unit) { return Number(unit?.Uni_tipo ?? unit?.tipoId); }
function unitStatus(unit) { return String(unit?.Uni_status ?? unit?.status ?? ''); }

function UnitCard({ unit, card, onOpen }) {
  return (
    <button type="button" className="unit-card" onClick={onOpen} aria-label={`Ver detalle de la unidad ${unit.Uni_no_economico || unit.Uni_id}`}>
      <div className="unit-card-heading">
        <span className="unit-card-icon"><Truck size={19} /></span>
        <strong>Unidad {unit.Uni_no_economico || unit.Uni_id}</strong>
        <span className="unit-type-pill">{unit.tipo_nombre || 'Unidad'}</span>
      </div>
      <div className="unit-card-field"><span><Hash size={14} /> Placas</span><strong>{card?.Pla_placas || 'Sin placas registradas'}</strong></div>
      <div className="unit-card-field"><span><ClipboardList size={14} /> No. T.C.</span><strong>{card?.TC_tarjeta || 'Sin tarjeta registrada'}</strong></div>
      <div className="unit-card-field"><span><Shield size={14} /> Propietario</span><strong title={unit.propietario_nombre || ''}>{unit.propietario_nombre || '—'}</strong></div>
      <div className="unit-card-field"><span><Box size={14} /> Marca</span><strong>{unit.Uni_marca || '—'}</strong></div>
      <div className="unit-card-field"><span><Box size={14} /> Modelo</span><strong>{unit.Uni_anio_modelo || unit.Uni_modelo || '—'}</strong></div>
      {unitStatus(unit) && <div className={`unit-status ${unitStatus(unit) === 'ALTA' ? 'is-active' : 'is-inactive'}`}>{unitStatus(unit) === 'ALTA' ? 'Activa' : 'Baja'}</div>}
    </button>
  );
}

function UnitDetailDialog({ unit, card, onClose }) {
  if (!unit) return null;
  const fields = [
    ['No. económico', unit.Uni_no_economico],
    ['Tipo', unit.tipo_nombre],
    ['Estado', unit.estado_nombre],
    ['Propietario legal', unit.propietario_nombre],
    ['Empresa actual', unit.empresa_nombre],
    ['Placas', card?.Pla_placas],
    ['Tarjeta de circulación', card?.TC_tarjeta],
    ['Marca', unit.Uni_marca],
    ['Modelo', unit.Uni_modelo],
    ['Año', unit.Uni_anio_modelo],
    ['Número de serie', unit.Uni_no_serie],
    ['Estatus', unit.Uni_status],
  ];
  return (
    <div className="workspace-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="workspace-modal unit-detail-modal" role="dialog" aria-modal="true" aria-labelledby="unit-detail-title">
        <button className="workspace-modal-close" type="button" aria-label="Cerrar" onClick={onClose}>×</button>
        <div className="workspace-modal-icon"><Truck size={20} /></div>
        <h2 id="unit-detail-title">Unidad {unit.Uni_no_economico || unit.Uni_id}</h2>
        <p>Datos recibidos del catálogo de unidades.</p>
        <dl className="unit-detail-list">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl>
        <button type="button" className="workspace-primary-button" onClick={onClose}>Cerrar</button>
      </section>
    </div>
  );
}

export default function UnitsPage() {
  const navigate = useNavigate();
  const { activeCompany } = useAuth();
  const [units, setUnits] = useState([]);
  const [allUnitsForTypes, setAllUnitsForTypes] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [status, setStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState('grid');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 200, total: 0, totalPages: 1 });
  const [selectedUnit, setSelectedUnit] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadUnits = useCallback(async (signal) => {
    if (!activeCompany?.id) return;
    setLoading(true);
    setError('');
    const filters = { page, limit: 20 };
    if (debouncedSearch) filters.search = debouncedSearch;
    if (selectedType !== 'all') filters.tipoId = selectedType;
    if (status) filters.status = status;
    try {
      const result = await getUnits(filters, { signal });
      setUnits(result.items);
      setPagination(result.pagination);
    } catch (requestError) {
      if (requestError.name !== 'AbortError') setError(requestError.message || 'No fue posible cargar las unidades.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [activeCompany?.id, debouncedSearch, selectedType, status, page]);

  useEffect(() => {
    const controller = new AbortController();
    loadUnits(controller.signal);
    return () => controller.abort();
  }, [loadUnits]);

  useEffect(() => {
    if (!activeCompany?.id) return undefined;
    const controller = new AbortController();
    let cancelled = false;
    getUnits({ page: 1, limit: 200 }, { signal: controller.signal })
      .then((result) => { if (!cancelled) setAllUnitsForTypes(result.items); })
      .catch(() => { /* Los tabs se derivan de los datos disponibles; no se bloquea el catálogo. */ });
    getCirculationCards({ signal: controller.signal })
      .then((result) => { if (!cancelled) setCards(result); })
      .catch(() => { if (!cancelled) setCards([]); });
    return () => { cancelled = true; controller.abort(); };
  }, [activeCompany?.id]);

  const typeOptions = useMemo(() => {
    const byId = new Map();
    [...allUnitsForTypes, ...units].forEach((unit) => {
      const id = unitTypeId(unit);
      const name = unit.tipo_nombre || `Tipo ${id}`;
      if (Number.isFinite(id) && id > 0 && !byId.has(String(id))) byId.set(String(id), { id: String(id), name });
    });
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [allUnitsForTypes, units]);

  const cardsByUnit = useMemo(() => {
    const map = new Map();
    cards.forEach((card) => {
      const id = Number(card.TC_unidad_id);
      if (Number.isFinite(id) && !map.has(id)) map.set(id, card);
    });
    return map;
  }, [cards]);

  if (!activeCompany) return <Navigate to="/seleccionar-empresa" replace />;

  function openUnit(unit) {
    setSelectedUnit(unit);
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
          <p className="workspace-subtitle">{activeCompany.name} · Gestiona los vehículos y remolques</p>
        </div>
        <div className="units-search-tools">
          <label className="units-search"><Search size={17} /><input type="search" placeholder="Buscar unidad…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /><button type="button" aria-label="Limpiar búsqueda" onClick={() => setSearch('')} hidden={!search}><X size={14} /></button></label>
          <button type="button" className={`units-filter-button${showFilters ? ' is-active' : ''}`} onClick={() => setShowFilters((current) => !current)}><Filter size={16} /> Filtros</button>
          <button type="button" className="units-change-company" onClick={() => navigate('/app')} title="Volver a elegir empresa"><Building2 size={16} /></button>
        </div>
      </section>

      <div className="units-toolbar">
        <div className="unit-type-tabs" role="tablist" aria-label="Filtrar por tipo de unidad">
          <button type="button" role="tab" aria-selected={selectedType === 'all'} className={selectedType === 'all' ? 'is-selected' : ''} onClick={() => selectType('all')}>Todos</button>
          {typeOptions.map((type) => <button type="button" role="tab" aria-selected={selectedType === type.id} className={selectedType === type.id ? 'is-selected' : ''} key={type.id} onClick={() => selectType(type.id)}>{type.name}</button>)}
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

      {error && <div className="workspace-error"><AlertCircle size={18} /><span>{error}</span><button type="button" onClick={() => loadUnits()}>Reintentar</button></div>}
      {loading ? <div className="workspace-loading">Cargando unidades…</div> : !error && units.length === 0 ? <div className="workspace-empty-state unit-empty"><Truck size={30} /><h2>No se encontraron unidades</h2><p>Prueba quitando filtros o verifica que existan unidades registradas para esta empresa.</p><button type="button" className="workspace-primary-button" onClick={clearFilters}>Limpiar búsqueda y filtros</button></div> : (
        <div className={`units-grid${view === 'list' ? ' is-list' : ''}`}>
          {units.map((unit) => <UnitCard key={unitId(unit)} unit={unit} card={cardsByUnit.get(unitId(unit))} onOpen={() => openUnit(unit)} />)}
        </div>
      )}

      <footer className="units-pagination">
        <span>{pagination.total ? `Mostrando ${Math.min((page - 1) * pagination.limit + 1, pagination.total)}–${Math.min(page * pagination.limit, pagination.total)} de ${pagination.total} unidades` : 'Sin registros'}</span>
        <div><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Página anterior"><ChevronLeft size={17} /></button><span>Página {page} de {Math.max(1, pagination.totalPages)}</span><button type="button" disabled={page >= (pagination.totalPages || 1) || loading} onClick={() => setPage((value) => value + 1)} aria-label="Página siguiente"><ChevronRight size={17} /></button></div>
      </footer>
      <UnitDetailDialog unit={selectedUnit} card={selectedUnit ? cardsByUnit.get(unitId(selectedUnit)) : null} onClose={() => setSelectedUnit(null)} />
    </WorkspaceLayout>
  );
}
