import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, BadgeCheck, Building2, ChevronLeft, ChevronRight, ClipboardList, Filter, Pencil, Plus, Search, Trash2, Truck, X } from 'lucide-react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import ProtectedDocumentLink from '../components/ProtectedDocumentLink';
import { useAuth } from '../context/AuthContext';
import { deleteUploadedDocument, uploadDocument } from '../services/creationApi';
import { apiRequest } from '../services/apiClient';
import { createCard, createPlate, createPlateMovement, deleteCard, deletePlate, getCardTypes, getCirculationCards, getPlateMovementTypes, getPlateMovements, getPlatePage, getCardPage, getUnits, updateCard, updatePlate } from '../services/fleetApi';
import '../styles/create-record.css';

const emptyPlate = { placas: '', status: 'ACTIVA', propietarioId: '' };
const emptyMovement = { tipoMovimientoId: '', costo: '0', fecha: new Date().toISOString().slice(0, 10) };
const emptyCard = { tarjeta: '', unidadId: '', costo: '0', tipoId: '', status: 'ACTIVA', noOriginal: '', placasId: '', fechaObtencion: new Date().toISOString().slice(0, 10), fechaVencimiento: '', fechaReposicion: '', costoReposicion: '', };
const idOf = (row, key) => Number(row?.[key] ?? row?.id);
const dateValue = (value) => value ? String(value).slice(0, 10) : '';
const money = (value) => Number(value || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

function Field({ label, children, required = false, hint }) {
  return <label className="create-field"><span>{label}{required && <b> *</b>}</span>{children}{hint && <small>{hint}</small>}</label>;
}
function PlateCard({ plate, movements, canEdit, canDelete, canAddMovement, onEdit, onDelete, onAddMovement }) {
  return <article className="unit-card">
    <div className="unit-card-open">
      <div className="unit-card-heading"><span className="unit-card-icon"><BadgeCheck size={19}/></span><strong>{plate.Pla_placas}</strong><span className="unit-type-pill">{plate.Pla_status}</span></div>
      <div className="unit-card-field"><span>Empresa actual</span><strong>{plate.empresa_nombre || '—'}</strong></div>
      <div className="unit-card-field"><span>Propietario</span><strong>{plate.propietario_nombre || '—'}</strong></div>
      <div className="unit-card-field"><span>Movimientos</span><strong>{movements.length}</strong></div>
      {movements.slice(0, 3).map((move) => <div className="unit-card-field" key={move.DP_id}><span>{move.tipo_movimiento_nombre || 'Movimiento'} · {dateValue(move.DP_fecha)}</span><strong>{money(move.DP_costo)} {move.DP_url && <ProtectedDocumentLink href={move.DP_url}>Comprobante</ProtectedDocumentLink>}</strong></div>)}
    </div>
    {(canEdit || canDelete || canAddMovement) && <div className="unit-card-actions">
      {canAddMovement && <button type="button" className="unit-card-action" onClick={onAddMovement}><Plus size={14}/> Movimiento</button>}
      {canEdit && <button type="button" className="unit-card-action" onClick={onEdit}><Pencil size={14}/> Editar</button>}
      {canDelete && <button type="button" className="unit-card-action is-danger" onClick={onDelete}><Trash2 size={14}/> Eliminar</button>}
    </div>}
  </article>;
}
function CardRecord({ card, canEdit, canDelete, onEdit, onDelete }) {
  return <article className="unit-card"><div className="unit-card-open">
    <div className="unit-card-heading"><span className="unit-card-icon"><ClipboardList size={19}/></span><strong>Tarjeta {card.TC_tarjeta}</strong><span className="unit-type-pill">{card.TC_status}</span></div>
    <div className="unit-card-field"><span>Unidad</span><strong>{card.Uni_no_economico || card.TC_unidad_id}</strong></div>
    <div className="unit-card-field"><span>Placas</span><strong>{card.Pla_placas || '—'}</strong></div>
    <div className="unit-card-field"><span>Tipo</span><strong>{card.tipo_tarjeta_nombre || '—'}</strong></div>
    <div className="unit-card-field"><span>Obtención</span><strong>{dateValue(card.TC_fecha_obtencion)}</strong></div>
    <div className="unit-card-field"><span>Vencimiento</span><strong>{dateValue(card.TC_fecha_vencimiento) || 'Sin vencimiento'}</strong></div>
    <div className="unit-card-field"><span>Costo</span><strong>{money(card.TC_costo)}</strong></div>
    {card.TC_url && <ProtectedDocumentLink href={card.TC_url}>Ver tarjeta</ProtectedDocumentLink>}
    {card.TC_url_reposicion && <ProtectedDocumentLink href={card.TC_url_reposicion}>Ver reposición</ProtectedDocumentLink>}
  </div>{(canEdit || canDelete) && <div className="unit-card-actions">
    {canEdit && <button type="button" className="unit-card-action" onClick={onEdit}><Pencil size={14}/> Editar</button>}
    {canDelete && <button type="button" className="unit-card-action is-danger" onClick={onDelete}><Trash2 size={14}/> Eliminar</button>}
  </div>}</article>;
}

export default function PlatesCardsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { activeCompany, companies, isAdminGlobal, can } = useAuth();
  const [tab, setTab] = useState(params.get('tipo') === 'tarjetas' ? 'tarjetas' : 'placas');
  const [plates, setPlates] = useState([]);
  const [allPlates, setAllPlates] = useState([]);
  const [cards, setCards] = useState([]);
  const [movements, setMovements] = useState([]);
  const [units, setUnits] = useState([]);
  const [plateTypes, setPlateTypes] = useState([]);
  const [cardTypes, setCardTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lookupError, setLookupError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });
  const [view, setView] = useState('grid');
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState({});
  const [movement, setMovement] = useState(emptyMovement);
  const [movementFile, setMovementFile] = useState(null);
  const [cardFile, setCardFile] = useState(null);
  const [replacementFile, setReplacementFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [movementTarget, setMovementTarget] = useState(null);
  const [movementTypes, setMovementTypes] = useState([]);
  const canReadPlates = isAdminGlobal || can('placas:ver');
  const canReadCards = isAdminGlobal || can('tarjetas:ver');
  const canEditPlates = isAdminGlobal || can('placas:editar');
  const canDeletePlates = isAdminGlobal || can('placas:eliminar');
  const canCreatePlates = isAdminGlobal || can('placas:crear');
  const canEditCards = isAdminGlobal || can('tarjetas:editar');
  const canDeleteCards = isAdminGlobal || can('tarjetas:eliminar');
  const canCreateCards = isAdminGlobal || can('tarjetas:crear');
  const canCreateMovement = isAdminGlobal || can('detalle_placas:crear');

  const load = useCallback(async (signal) => {
    setLoading(true); setError('');
    try {
      const filters = { page, limit: 20, ...(isAdminGlobal && activeCompany?.id ? { empresaId: activeCompany.id } : {}), ...(search.trim() ? { search: search.trim() } : {}), ...(status ? { status } : {}) };
      const [result, moveResult] = tab === 'placas'
        ? await Promise.all([getPlatePage(filters, { signal }), getPlateMovements({ page: 1, limit: 1000, ...(isAdminGlobal && activeCompany?.id ? { empresaId: activeCompany.id } : {}) }, { signal })])
        : [await getCardPage(filters, { signal }), null];
      if (tab === 'placas') {
        setPlates(result.items); setPagination(result.pagination); setMovements(moveResult.items);
      } else { setCards(result.items); setPagination(result.pagination); }
    } catch (err) { if (err.name !== 'AbortError') setError(err.message || 'No se pudieron cargar los registros.'); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [tab, page, search, status, activeCompany?.id, isAdminGlobal]);

  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [load]);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([getUnits({ page: 1, limit: 1000, ...(isAdminGlobal && activeCompany?.id ? { empresaId: activeCompany.id } : {}) }, { signal: controller.signal }), getPlates({ page: 1, limit: 1000, ...(isAdminGlobal && activeCompany?.id ? { empresaId: activeCompany.id } : {}) }, { signal: controller.signal }), getPlateMovementTypes({}, { signal: controller.signal }), getCardTypes({}, { signal: controller.signal })])
      .then(([unitResult, allPlateRows, moveOptions, cardOptions]) => {
        setUnits(unitResult.items);
        setAllPlates(allPlateRows);
        setMovementTypes(moveOptions);
        setPlateTypes(moveOptions);
        setCardTypes(cardOptions);
      })
      .catch((err) => { if (err.name !== 'AbortError') setLookupError(err.message || 'No se pudieron cargar catálogos.'); });
    return () => controller.abort();
  }, [activeCompany?.id, isAdminGlobal]);

  const plateOptions = useMemo(() => allPlates.map((p) => ({ value: String(p.Pla_id), label: p.Pla_placas })), [plates]);
  const unitOptions = useMemo(() => units.map((u) => ({ value: String(u.Uni_id), label: `${u.Uni_no_economico} · ${u.Uni_marca || ''} ${u.Uni_modelo || ''}` })), [units]);
  const visible = tab === 'placas' ? plates : cards;

  function changeTab(next) { setTab(next); setParams({ tipo: next }); setPage(1); setSearch(''); setStatus(''); setEditor(null); setSuccess(''); setError(''); }
  function beginCreate() {
    setError(''); setSuccess('');
    setForm(tab === 'placas' ? { ...emptyPlate(), empresaActualId: activeCompany?.id || '' } : { ...emptyCard() });
    setEditor({ type: tab, id: null });
    setCardFile(null); setReplacementFile(null); setMovementFile(null);
  }
  function beginEdit(record) {
    setError(''); setSuccess('');
    setForm(tab === 'placas' ? { placas: record.Pla_placas, status: record.Pla_status, propietarioId: record.Pla_propietario || '' } : {
      tarjeta: record.TC_tarjeta, unidadId: String(record.TC_unidad_id), costo: String(record.TC_costo), tipoId: String(record.TC_tipo),
      status: record.TC_status, noOriginal: record.TC_no_original || '', placasId: String(record.TC_placas_id),
      fechaObtencion: dateValue(record.TC_fecha_obtencion), fechaVencimiento: dateValue(record.TC_fecha_vencimiento),
      fechaReposicion: dateValue(record.TC_fecha_reposicion), costoReposicion: record.TC_costo_reposicion ?? '',
    });
    setEditor({ type: tab, id: idOf(record, tab === 'placas' ? 'Pla_id' : 'TC_id') });
    setCardFile(null); setReplacementFile(null);
  }
  async function handleSubmit(event) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    const uploaded = [];
    try {
      if (editor.type === 'placas') {
        const payload = { placas: form.placas.trim(), status: form.status.trim(), propietarioId: form.propietarioId ? Number(form.propietarioId) : null, empresaActualId: Number(activeCompany?.id || form.empresaActualId) };
        if (!payload.empresaActualId) throw new Error('Selecciona la empresa actual de la placa.');
        if (editor.id) await updatePlate(editor.id, payload);
        else await createPlate(payload);
      } else {
        let doc = null; let replacement = null;
        const selectedUnit = units.find((u) => Number(u.Uni_id) === Number(form.unidadId));
        const uploadCompanyId = selectedUnit?.Uni_empresa_actual || activeCompany?.id;
        if (cardFile) { doc = await uploadDocument(cardFile, 'tarjeta', uploadCompanyId); uploaded.push(doc); }
        if (replacementFile) { replacement = await uploadDocument(replacementFile, 'tarjeta_reposicion', uploadCompanyId); uploaded.push(replacement); }
        const payload = {
          tarjeta: form.tarjeta.trim(), unidadId: Number(form.unidadId), costo: Number(form.costo), tipoId: Number(form.tipoId),
          status: form.status, noOriginal: form.noOriginal.trim() || null, placasId: Number(form.placasId),
          fechaObtencion: form.fechaObtencion, fechaVencimiento: form.fechaVencimiento || null,
          fechaReposicion: form.fechaReposicion || null, costoReposicion: form.costoReposicion === '' ? null : Number(form.costoReposicion),
          ...(doc ? { url: doc.url } : {}), ...(replacement ? { urlReposicion: replacement.url } : {}),
        };
        if (!editor.id && !doc) throw new Error('Adjunta el documento de la tarjeta de circulación.');
        if (!uploadCompanyId) throw new Error('No se pudo determinar la empresa de la unidad seleccionada.');
        const previous = editor.id ? cards.find((item) => Number(item.TC_id) === Number(editor.id)) : null;
        if (!uploadCompanyId) throw new Error('No se pudo determinar la empresa de la unidad seleccionada.');
        if (editor.id) await updateCard(editor.id, payload); else await createCard(payload);
        if (previous?.TC_url && doc?.url) await deleteUploadedDocument(previous.TC_url, uploadCompanyId).catch(() => {});
        if (previous?.TC_url_reposicion && replacement?.url) await deleteUploadedDocument(previous.TC_url_reposicion, uploadCompanyId).catch(() => {});
      }
      setEditor(null); setSuccess(editor.id ? 'Registro actualizado correctamente.' : 'Registro creado correctamente.');
      await load();
      if (editor.type === 'placas') setAllPlates(await getPlates({ page: 1, limit: 1000, ...(isAdminGlobal && activeCompany?.id ? { empresaId: activeCompany.id } : {}) }));
    } catch (err) {
      await Promise.allSettled(uploaded.map((file) => deleteUploadedDocument(file.url, activeCompany?.id)));
      setError(err.message || 'No se pudo guardar el registro.');
    } finally { setBusy(false); }
  }
  async function handleMovementSubmit(event) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    let uploaded = null;
    try {
      if (!movementFile) throw new Error('Adjunta el comprobante del movimiento.');
      uploaded = await uploadDocument(movementFile, 'detalle_placa', activeCompany?.id);
      await createPlateMovement({ placasId: Number(movementTarget.Pla_id), tipoMovimientoId: Number(movement.tipoMovimientoId), costo: Number(movement.costo), fecha: movement.fecha, url: uploaded.url });
      setMovementTarget(null); setMovement(emptyMovement); setMovementFile(null); setSuccess('Movimiento agregado a la placa.');
      await load();
    } catch (err) {
      if (uploaded?.uuid) await apiRequest('/upload/' + uploaded.uuid, { method: 'DELETE' }).catch(() => {});
      setError(err.message || 'No se pudo agregar el movimiento.');
    } finally { setBusy(false); }
  }
  async function remove(record) {
    const isPlate = tab === 'placas';
    const label = isPlate ? record.Pla_placas : record.TC_tarjeta;
    if (!window.confirm(`¿Eliminar ${isPlate ? 'la placa' : 'la tarjeta'} ${label}? Esta acción no se puede deshacer.`)) return;
    setBusy(true); setError('');
    try {
      if (isPlate) await deletePlate(record.Pla_id); else await deleteCard(record.TC_id);
      setSuccess('Registro eliminado correctamente.'); await load();
      if (isPlate) setAllPlates(await getPlates({ page: 1, limit: 1000, ...(isAdminGlobal && activeCompany?.id ? { empresaId: activeCompany.id } : {}) }));
    } catch (err) { setError(err.message || 'No se pudo eliminar el registro.'); }
    finally { setBusy(false); }
  }

  if (!activeCompany?.id && !isAdminGlobal) return <Navigate to="/seleccionar-empresa" replace state={{ from: '/placas-tarjetas' }} />;
  if (!canReadPlates && !canReadCards) return <Navigate to="/app" replace />;
  const allowCreate = tab === 'placas' ? canCreatePlates : canCreateCards;
  const items = visible;

  return <WorkspaceLayout activeNav="plates">
    <section className="units-heading-row">
      <div><h1>Placas y tarjetas de circulación</h1><p className="workspace-subtitle">{activeCompany?.name || 'Todas las empresas'} · Administración de placas, movimientos y tarjetas</p></div>
      <div className="units-search-tools">
        {allowCreate && <button type="button" className="units-add-button" onClick={beginCreate}><Plus size={16}/> Añadir</button>}
        <label className="units-search"><Search size={17}/><input type="search" placeholder={tab === 'placas' ? 'Buscar placa…' : 'Buscar tarjeta, unidad o placa…'} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}/>{search && <button type="button" onClick={() => setSearch('')}><X size={14}/></button>}</label>
        <button type="button" className="units-change-company" onClick={() => navigate('/app')} title="Panel principal"><Building2 size={16}/></button>
      </div>
    </section>
    <div className="units-toolbar">
      <div className="unit-type-tabs" role="tablist" aria-label="Tipo de registro">
        <button type="button" role="tab" aria-selected={tab === 'placas'} className={tab === 'placas' ? 'is-selected' : ''} onClick={() => changeTab('placas')}>Placas</button>
        <button type="button" role="tab" aria-selected={tab === 'tarjetas'} className={tab === 'tarjetas' ? 'is-selected' : ''} onClick={() => changeTab('tarjetas')}>Tarjetas de circulación</button>
      </div>
      <button type="button" className="units-filter-button" onClick={() => setStatus((s) => s ? '' : 'ACTIVA')}><Filter size={16}/> {status ? 'Quitar filtro' : 'Activas'}</button>
      <div className="units-view-switch" aria-label="Modo de visualización"><button type="button" className={view === 'grid' ? 'is-selected' : ''} onClick={() => setView('grid')} title="Cuadrícula">▦</button><button type="button" className={view === 'list' ? 'is-selected' : ''} onClick={() => setView('list')} title="Lista">☷</button></div>
    </div>
    {lookupError && <p className="registry-muted-note">{lookupError}</p>}
    {error && <div className="workspace-error"><AlertCircle size={18}/><span>{error}</span></div>}
    {success && <div className="create-alert is-success" role="status">{success}</div>}
    {loading ? <div className="workspace-loading">Cargando registros…</div> : !items.length ? <div className="workspace-empty-state"><BadgeCheck size={30}/><h2>No se encontraron registros</h2><p>Prueba con otra búsqueda o agrega un registro nuevo.</p></div> : <div className={`units-grid${view === 'list' ? ' is-list' : ''}`}>
      {tab === 'placas' ? plates.map((plate) => <PlateCard key={plate.Pla_id} plate={plate} movements={movements.filter((m) => Number(m.DP_placas_id) === Number(plate.Pla_id))} canEdit={canEditPlates} canDelete={canDeletePlates} canAddMovement={canCreateMovement} onEdit={() => beginEdit(plate)} onDelete={() => remove(plate)} onAddMovement={() => { setMovementTarget(plate); setMovement(emptyMovement); setMovementFile(null); }}/>) :
      cards.map((card) => <CardRecord key={card.TC_id} card={card} canEdit={canEditCards} canDelete={canDeleteCards} onEdit={() => beginEdit(card)} onDelete={() => remove(card)}/>)}
    </div>}
    <footer className="units-pagination"><span>{pagination.total} registros</span><div><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={17}/></button><span>Página {page} de {Math.max(1,pagination.totalPages)}</span><button type="button" disabled={page >= pagination.totalPages || loading} onClick={() => setPage((p) => p + 1)}><ChevronRight size={17}/></button></div></footer>
    {editor && <div className="workspace-modal-backdrop"><form className="workspace-modal company-editor-modal" onSubmit={handleSubmit}>
      <button className="workspace-modal-close" type="button" onClick={() => setEditor(null)}><X size={18}/></button>
      <h2>{editor.id ? 'Editar' : 'Crear'} {editor.type === 'placas' ? 'placa' : 'tarjeta de circulación'}</h2>
      {editor.type === 'placas' ? <>
        {isAdminGlobal && !activeCompany?.id && <Field label="Empresa actual" required><select required value={form.empresaActualId || ''} onChange={(e) => setForm((v) => ({...v, empresaActualId:e.target.value}))}><option value="">Selecciona empresa</option>{companies.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>}
        <Field label="Número de placas" required><input value={form.placas || ''} maxLength={10} required onChange={(e) => setForm((v) => ({...v, placas:e.target.value}))}/></Field>
        <Field label="Estatus" required><input value={form.status || ''} maxLength={20} required onChange={(e) => setForm((v) => ({...v,status:e.target.value}))}/></Field>
        {isAdminGlobal && <Field label="Propietario"><select value={form.propietarioId || ''} onChange={(e) => setForm((v) => ({...v,propietarioId:e.target.value}))}><option value="">Sin propietario</option>{(activeCompany ? [{id:activeCompany.id,name:activeCompany.name}] : []).map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>}
      </> : <>
        <Field label="Número de tarjeta" required><input required maxLength={50} value={form.tarjeta || ''} onChange={(e)=>setForm((v)=>({...v,tarjeta:e.target.value}))}/></Field>
        <Field label="Unidad" required><select required value={form.unidadId || ''} onChange={(e)=>setForm((v)=>({...v,unidadId:e.target.value}))}><option value="">Selecciona unidad</option>{unitOptions.map((o)=><option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
        <Field label="Placa" required><select required value={form.placasId || ''} onChange={(e)=>setForm((v)=>({...v,placasId:e.target.value}))}><option value="">Selecciona placa</option>{plateOptions.map((o)=><option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
        <Field label="Tipo de tarjeta" required><select required value={form.tipoId || ''} onChange={(e)=>setForm((v)=>({...v,tipoId:e.target.value}))}><option value="">Selecciona tipo</option>{cardTypes.map((t)=><option key={t.TpT_id} value={t.TpT_id}>{t.TpT_nombre}</option>)}</select></Field>
        <Field label="Estatus" required><input required value={form.status || ''} onChange={(e)=>setForm((v)=>({...v,status:e.target.value}))}/></Field>
        <Field label="Costo" required><input type="number" min="0" step="0.01" required value={form.costo || ''} onChange={(e)=>setForm((v)=>({...v,costo:e.target.value}))}/></Field>
        <Field label="Número original"><input value={form.noOriginal || ''} onChange={(e)=>setForm((v)=>({...v,noOriginal:e.target.value}))}/></Field>
        <Field label="Fecha de obtención" required><input type="date" required value={form.fechaObtencion || ''} onChange={(e)=>setForm((v)=>({...v,fechaObtencion:e.target.value}))}/></Field>
        <Field label="Fecha de vencimiento"><input type="date" value={form.fechaVencimiento || ''} onChange={(e)=>setForm((v)=>({...v,fechaVencimiento:e.target.value}))}/></Field>
        <Field label="Fecha de reposición"><input type="date" value={form.fechaReposicion || ''} onChange={(e)=>setForm((v)=>({...v,fechaReposicion:e.target.value}))}/></Field>
        <Field label="Costo de reposición"><input type="number" min="0" step="0.01" value={form.costoReposicion ?? ''} onChange={(e)=>setForm((v)=>({...v,costoReposicion:e.target.value}))}/></Field>
        {editor.id && cards.find((item) => Number(item.TC_id) === Number(editor.id))?.TC_url && <ProtectedDocumentLink href={cards.find((item) => Number(item.TC_id) === Number(editor.id)).TC_url}>Ver documento actual</ProtectedDocumentLink>}
        <Field label={editor.id ? 'Reemplazar documento de tarjeta' : 'Documento de tarjeta'} required={!editor.id}><input className="create-file-input" type="file" accept=".pdf,.jpg,.jpeg,.png" required={!editor.id && !cardFile} onChange={(e)=>setCardFile(e.target.files?.[0] || null)}/>{editor.id && <small>Deja vacío para conservar el documento actual.</small>}</Field>
        <Field label="Documento de reposición"><input className="create-file-input" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e)=>setReplacementFile(e.target.files?.[0] || null)}/></Field>
      </>}
      {error && <div className="workspace-error">{error}</div>}
      <div className="create-form-actions"><button type="button" className="workspace-secondary-button" disabled={busy} onClick={()=>setEditor(null)}>Cancelar</button><button type="submit" className="workspace-primary-button" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button></div>
    </form></div>}
    {movementTarget && <div className="workspace-modal-backdrop"><form className="workspace-modal company-editor-modal" onSubmit={handleMovementSubmit}>
      <button className="workspace-modal-close" type="button" onClick={()=>setMovementTarget(null)}><X size={18}/></button>
      <h2>Agregar movimiento · {movementTarget.Pla_placas}</h2>
      <Field label="Tipo de movimiento" required><select required value={movement.tipoMovimientoId} onChange={(e)=>setMovement((v)=>({...v,tipoMovimientoId:e.target.value}))}><option value="">Selecciona tipo</option>{movementTypes.map((t)=><option key={t.TpMP_id} value={t.TpMP_id}>{t.TpMP_nombre}</option>)}</select></Field>
      <Field label="Costo" required><input type="number" min="0" step="0.01" required value={movement.costo} onChange={(e)=>setMovement((v)=>({...v,costo:e.target.value}))}/></Field>
      <Field label="Fecha" required><input type="date" required value={movement.fecha} onChange={(e)=>setMovement((v)=>({...v,fecha:e.target.value}))}/></Field>
      <Field label="Comprobante" required><input className="create-file-input" type="file" required accept=".pdf,.jpg,.jpeg,.png" onChange={(e)=>setMovementFile(e.target.files?.[0] || null)}/></Field>
      <div className="create-form-actions"><button type="button" className="workspace-secondary-button" onClick={()=>setMovementTarget(null)} disabled={busy}>Cancelar</button><button type="submit" className="workspace-primary-button" disabled={busy}>{busy?'Guardando…':'Agregar movimiento'}</button></div>
    </form></div>}
  </WorkspaceLayout>;
}
