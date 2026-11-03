import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Activity, ArrowUpRight, BadgeCheck, Building2, Database, Grid2X2, Info, List, Pencil, Plus, Settings, Trash2, TrendingUp, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';
import { getActiveUnitsCount } from '../services/fleetApi';
import { createCompany, deleteCompany, getCompanyById, updateCompany } from '../services/companyApi';

const CARD_TONES = ['red', 'wine', 'gray', 'charcoal', 'red'];

function initials(label) {
  return String(label || 'GAAL').trim().split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'GA';
}

function NoticeDialog({ notice, onClose }) {
  if (!notice) return null;
  return createPortal(
    <div className="workspace-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="workspace-modal" role="dialog" aria-modal="true" aria-labelledby="notice-title">
        <button className="workspace-modal-close" type="button" aria-label="Cerrar" onClick={onClose}><X size={18} /></button>
        <div className="workspace-modal-icon"><Info size={20} /></div>
        <h2 id="notice-title">{notice.title}</h2>
        <p>{notice.message}</p>
        {notice.details && <div className="workspace-modal-details">{notice.details}</div>}
        <button type="button" className="workspace-primary-button" onClick={onClose}>Entendido</button>
      </section>
    </div>,
    document.body,
  );
}

function CompanyEditorDialog({ company, isCreate = false, form, setForm, busy, error, onClose, onSubmit }) {
  if (!company) return null;
  return createPortal(
    <div className="workspace-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <form className="workspace-modal company-editor-modal" role="dialog" aria-modal="true" aria-labelledby="company-editor-title" onSubmit={onSubmit}>
        <button className="workspace-modal-close" type="button" aria-label="Cerrar" disabled={busy} onClick={onClose}><X size={18} /></button>
        <div className="workspace-modal-icon"><Building2 size={20} /></div>
        <h2 id="company-editor-title">{isCreate ? 'Añadir empresa' : 'Editar empresa'}</h2>
        <p>{isCreate ? 'Registra una nueva empresa en el sistema. El RFC debe ser único.' : 'Los cambios se guardarán en la empresa del backend.'}</p>
        <label className="company-form-label">Nombre de empresa<input value={form.nombre} maxLength={100} required onChange={(event) => setForm((old) => ({ ...old, nombre: event.target.value }))} /></label>
        <label className="company-form-label">Nombre corto<input value={form.nombreCorto} maxLength={20} onChange={(event) => setForm((old) => ({ ...old, nombreCorto: event.target.value }))} /></label>
        <label className="company-form-label">Dirección<input value={form.direccion} maxLength={150} onChange={(event) => setForm((old) => ({ ...old, direccion: event.target.value }))} /></label>
        <label className="company-form-label">RFC<input value={form.rfc} maxLength={13} minLength={12} required onChange={(event) => setForm((old) => ({ ...old, rfc: event.target.value.toUpperCase() }))} /></label>
        {error && <div className="workspace-error" role="alert">{error}</div>}
        <div className="company-form-actions"><button type="button" className="workspace-secondary-button" disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className="workspace-primary-button" disabled={busy}>{busy ? 'Guardando…' : isCreate ? 'Crear empresa' : 'Guardar cambios'}</button></div>
      </form>
    </div>,
    document.body,
  );
}

function DeleteCompanyDialog({ company, busy, error, onClose, onConfirm }) {
  if (!company) return null;
  return createPortal(
    <div className="workspace-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section className="workspace-modal" role="dialog" aria-modal="true" aria-labelledby="delete-company-title">
        <button className="workspace-modal-close" type="button" aria-label="Cerrar" disabled={busy} onClick={onClose}><X size={18} /></button>
        <div className="workspace-modal-icon"><Trash2 size={20} /></div>
        <h2 id="delete-company-title">Eliminar empresa</h2>
        <p>Se solicitará al backend eliminar <strong>{company.name}</strong>. La base de datos puede rechazarlo si existen unidades, usuarios u otros registros relacionados.</p>
        {error && <div className="workspace-error" role="alert">{error}</div>}
        <div className="company-form-actions"><button type="button" className="workspace-secondary-button" disabled={busy} onClick={onClose}>Cancelar</button><button type="button" className="workspace-danger-button" disabled={busy} onClick={onConfirm}>{busy ? 'Eliminando…' : 'Confirmar eliminación'}</button></div>
      </section>
    </div>,
    document.body,
  );
}

function CompanyCard({ company, index, active, count, countStatus, onOpen, onInfo, onEdit, onDelete, showManagementActions, expanded, companyDetails, infoStatus, infoError }) {
  const details = companyDetails || company;
  const name = details?.name || details?.Emp_nombre || company.name || '—';
  const shortName = details?.shortName || details?.Emp_nombre_corto || company.shortName || '—';
  const rfc = details?.rfc || details?.Emp_rfc || company.rfc || 'No disponible';
  const address = details?.address || details?.Emp_direccion || company.address || 'No disponible';
  return (
    <article className={`dashboard-company-card${expanded ? ' has-expanded-info' : ''}`}>
      <button className={`dashboard-company-cover tone-${CARD_TONES[index % CARD_TONES.length]}`} type="button" onClick={onOpen} aria-label={`Abrir unidades de ${company.name}`}>
        <span className="company-monogram">{initials(company.shortName || company.name)}</span>
        <span className="dashboard-company-name">{company.name}</span>
        {active && <span className="company-active-tag">Contexto actual</span>}
        <ArrowUpRight className="company-open-arrow" size={19} />
      </button>
      <div className="dashboard-company-body">
        <div className="company-unit-count"><span><TrendingUp size={15} /> Unidades Activas</span><strong>{countStatus === 'loading' ? '…' : countStatus === 'error' ? '—' : Number(count || 0).toLocaleString('es-MX')}</strong></div>
        <div className="company-card-actions">
          <div className="company-action-group">{showManagementActions && <><button type="button" title={`Editar ${company.name}`} aria-label={`Editar ${company.name}`} onClick={onEdit}><Pencil size={14} /></button><span className="company-action-separator" /><button type="button" title={`Eliminar ${company.name}`} aria-label={`Eliminar ${company.name}`} onClick={onDelete}><Trash2 size={14} /></button></>}</div>
          <button type="button" className={`company-info-button${expanded ? ' is-expanded' : ''}`} title={expanded ? 'Ocultar información de empresa' : 'Mostrar información de empresa'} aria-label={expanded ? `Ocultar información de ${company.name}` : `Mostrar información de ${company.name}`} aria-expanded={expanded} onClick={onInfo}><Info size={15} /></button>
        </div>
        {expanded && <section className="company-info-panel" aria-label={`Información de ${company.name}`}>
          <div className="company-info-grid">
            <div><span>Nombre</span><strong>{name}</strong></div>
            <div><span>Nombre corto</span><strong>{shortName}</strong></div>
            <div><span>RFC</span><strong>{rfc}</strong></div>
            <div className="company-info-address"><span>Dirección</span><strong>{address}</strong></div>
            <div><span>Rol asignado</span><strong>{company.roleLabel || company.role || 'Acceso global'}</strong></div>
          </div>
          {infoStatus === 'loading' && <p className="company-info-hint">Consultando información completa…</p>}
          {infoStatus === 'error' && <p className="company-info-hint is-warning">No se pudieron consultar los datos adicionales del backend. Se muestran los datos disponibles del contexto.{infoError ? ` Detalle: ${infoError}` : ''}</p>}
        </section>}
      </div>
    </article>
  );
}

export default function AppHome() {
  const navigate = useNavigate();
  const { companies, activeCompany, selectCompany, isAdminGlobal, patchCompany, removeCompany, addCompany, can } = useAuth();
  const [counts, setCounts] = useState({});
  const [viewMode, setViewMode] = useState('grid');
  const [notice, setNotice] = useState(null);
  const [editingCompany, setEditingCompany] = useState(null);
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState(null);
  const [editForm, setEditForm] = useState({ nombre: '', nombreCorto: '', direccion: '', rfc: '' });
  const [operationBusy, setOperationBusy] = useState(false);
  const [operationError, setOperationError] = useState('');
  const [expandedCompanyId, setExpandedCompanyId] = useState(null);
  const [companyDetails, setCompanyDetails] = useState({});
  const [companyInfoStatus, setCompanyInfoStatus] = useState({});
  const [companyInfoErrors, setCompanyInfoErrors] = useState({});

  const realCompanies = useMemo(() => companies.filter((company) => company.scope !== 'global' && company.id != null), [companies]);
  // El permiso puede estar asignado en cualquiera de las empresas del usuario;
  // al abrir el módulo se usará la empresa seleccionada para la validación RBAC.
  const canAccessModule = (permission) => isAdminGlobal || (activeCompany
    ? can(permission)
    : companies.some((company) => company.permissions?.some((granted) => granted === permission || (permission.endsWith(':ver') && granted === 'ver'))));

  useEffect(() => {
    let cancelled = false;
    setCounts((current) => Object.fromEntries(realCompanies.map((company) => [String(company.id), { value: current[String(company.id)]?.value ?? null, status: 'loading' }])));
    Promise.all(realCompanies.map(async (company) => {
      try {
        const total = await getActiveUnitsCount(company.id);
        return [String(company.id), { value: total, status: 'ready' }];
      } catch {
        return [String(company.id), { value: null, status: 'error' }];
      }
    })).then((entries) => { if (!cancelled) setCounts(Object.fromEntries(entries)); });
    return () => { cancelled = true; };
  }, [realCompanies]);

  function openCompany(company) {
    try {
      selectCompany(company);
      navigate('/unidades');
    } catch (error) {
      setNotice({ title: 'No se pudo abrir la empresa', message: error.message || 'Verifica las empresas asignadas a tu usuario.' });
    }
  }

  async function toggleCompanyInfo(company) {
    const key = String(company.id);
    if (String(expandedCompanyId) === key) {
      setExpandedCompanyId(null);
      return;
    }
    setExpandedCompanyId(key);
    setCompanyInfoStatus((current) => ({ ...current, [key]: 'loading' }));
    setCompanyInfoErrors((current) => ({ ...current, [key]: '' }));
    try {
      const raw = await getCompanyById(company.id, { headers: { 'X-Empresa-Id': key } });
      const details = raw?.empresa || raw?.company || raw?.data || raw || {};
      setCompanyDetails((current) => ({ ...current, [key]: {
        name: details.Emp_nombre ?? details.nombre ?? details.name ?? company.name,
        shortName: details.Emp_nombre_corto ?? details.nombreCorto ?? details.shortName ?? company.shortName,
        rfc: details.Emp_rfc ?? details.rfc ?? company.rfc ?? '',
        address: details.Emp_direccion ?? details.direccion ?? details.address ?? company.address ?? '',
      } }));
      setCompanyInfoStatus((current) => ({ ...current, [key]: 'ready' }));
    } catch (error) {
      setCompanyInfoStatus((current) => ({ ...current, [key]: 'error' }));
      setCompanyInfoErrors((current) => ({ ...current, [key]: error.message || '' }));
    }
  }

  function beginEdit(company) {
    setOperationError('');
    setEditForm({ nombre: company.name || '', nombreCorto: company.shortName || '', direccion: company.address || '', rfc: company.rfc || '' });
    setCreatingCompany(false);
    setEditingCompany(company);
  }

  function beginCreateCompany() {
    setOperationError('');
    setEditForm({ nombre: '', nombreCorto: '', direccion: '', rfc: '' });
    setEditingCompany(null);
    setCreatingCompany(true);
  }

  async function saveCompany(event) {
    event.preventDefault();
    if (!editingCompany && !creatingCompany) return;
    setOperationError('');
    setOperationBusy(true);
    try {
      if (creatingCompany) {
        const created = await createCompany(editForm);
        addCompany(created);
        setCreatingCompany(false);
        setNotice({ title: 'Empresa creada', message: `${created?.Emp_nombre || editForm.nombre} se registró correctamente en el backend.` });
      } else {
        const updated = await updateCompany(editingCompany.id, editForm);
        patchCompany(editingCompany.id, {
          name: updated?.Emp_nombre ?? editForm.nombre,
          shortName: updated?.Emp_nombre_corto ?? editForm.nombreCorto,
          address: updated?.Emp_direccion ?? editForm.direccion,
          rfc: updated?.Emp_rfc ?? editForm.rfc,
        });
        setEditingCompany(null);
        setNotice({ title: 'Empresa actualizada', message: 'La información se guardó correctamente en el backend.' });
      }
    } catch (error) {
      setOperationError(error.message || (creatingCompany ? 'No se pudo crear la empresa.' : 'No se pudo actualizar la empresa.'));
    } finally {
      setOperationBusy(false);
    }
  }

  async function confirmDeleteCompany() {
    if (!deletingCompany) return;
    setOperationError('');
    setOperationBusy(true);
    try {
      const companyName = deletingCompany.name;
      await deleteCompany(deletingCompany.id);
      removeCompany(deletingCompany.id);
      setDeletingCompany(null);
      setNotice({ title: 'Empresa eliminada', message: `${companyName} fue eliminada por el backend.` });
    } catch (error) {
      setOperationError(error.message || 'No se pudo eliminar la empresa. Es posible que tenga registros relacionados.');
    } finally {
      setOperationBusy(false);
    }
  }

  return (
    <WorkspaceLayout activeNav="home">
      <section className="dashboard-heading-row">
        <div className="dashboard-heading-copy"><p className="workspace-eyebrow">ACTIVOS · GESTIÓN MULTIEMPRESA</p><h1>Bienvenido al Panel Principal</h1><p className="workspace-subtitle">Selecciona una empresa para gestionar su flotilla, o accede a los catálogos y la administración.</p></div>
        <div className="dashboard-heading-tools"><div className="dashboard-company-total"><span>{realCompanies.length}</span><div><strong>Empresas disponibles</strong><small>Según tu acceso</small></div></div><div className="workspace-view-toggle" aria-label="Vista de empresas"><button type="button" className={viewMode === 'grid' ? 'is-selected' : ''} onClick={() => setViewMode('grid')}><Grid2X2 size={15} /> Grid</button><button type="button" className={viewMode === 'list' ? 'is-selected' : ''} onClick={() => setViewMode('list')}><List size={16} /> Lista</button></div></div>
      </section>

      {realCompanies.length === 0 && <div className="workspace-empty-state"><Building2 size={30} /><h2>No hay empresas disponibles</h2><p>{isAdminGlobal ? 'Puedes añadir una empresa desde la tarjeta “Añadir empresa”.' : 'Tu usuario no tiene empresas en el contexto recibido por la API. Contacta al administrador del sistema.'}</p></div>}
      <div className={`dashboard-card-grid${viewMode === 'list' ? ' is-list' : ''}`}>
        {realCompanies.map((company, index) => {
          const currentCount = counts[String(company.id)] || { value: null, status: 'loading' };
          const key = String(company.id);
          return <CompanyCard key={company.id} company={company} index={index} active={String(activeCompany?.id) === String(company.id)} count={currentCount.value} countStatus={currentCount.status} onOpen={() => openCompany(company)} onInfo={() => toggleCompanyInfo(company)} onEdit={() => beginEdit(company)} onDelete={() => { setOperationError(''); setDeletingCompany(company); }} showManagementActions={isAdminGlobal} expanded={expandedCompanyId === key} companyDetails={companyDetails[key]} infoStatus={companyInfoStatus[key]} infoError={companyInfoErrors[key]} />;
        })}
        {isAdminGlobal && <button type="button" className="dashboard-shortcut-card add-company-card" onClick={beginCreateCompany}><span className="dashboard-shortcut-cover tone-red"><Plus size={34} strokeWidth={1.9} /><strong>Añadir empresa</strong></span><span className="dashboard-shortcut-body"><span><Building2 size={15} /> Nueva empresa</span><strong>Crear <ArrowUpRight size={15} /></strong></span></button>}
        {canAccessModule('catalogos:ver') && <button type="button" className="dashboard-shortcut-card" onClick={() => navigate('/catalogos')}><span className="dashboard-shortcut-cover tone-wine"><Database size={33} strokeWidth={1.7} /><strong>Catálogos</strong></span><span className="dashboard-shortcut-body"><span><Activity size={15} /> Datos compartidos</span><strong>Explorar <ArrowUpRight size={15} /></strong></span></button>}
        {(canAccessModule('unidades:ver') || canAccessModule('placas:ver') || canAccessModule('tarjetas:ver')) && <button type="button" className="dashboard-shortcut-card" onClick={() => navigate('/placas-tarjetas')}><span className="dashboard-shortcut-cover tone-wine"><BadgeCheck size={33} strokeWidth={1.7} /><strong>Placas y tarjetas</strong></span><span className="dashboard-shortcut-body"><span><Activity size={15} /> Placas y circulación</span><strong>Administrar <ArrowUpRight size={15} /></strong></span></button>}
        {canAccessModule('aseguradoras:ver') && <button type="button" className="dashboard-shortcut-card" onClick={() => navigate('/aseguradoras')}><span className="dashboard-shortcut-cover tone-charcoal"><Building2 size={33} strokeWidth={1.7} /><strong>Aseguradoras</strong></span><span className="dashboard-shortcut-body"><span><Activity size={15} /> Directorio compartido</span><strong>Consultar <ArrowUpRight size={15} /></strong></span></button>}
        {isAdminGlobal && <button type="button" className="dashboard-shortcut-card" onClick={() => navigate('/administracion')}><span className="dashboard-shortcut-cover tone-gray"><Settings size={33} strokeWidth={1.9} /><strong>Administración</strong></span><span className="dashboard-shortcut-body"><span><Settings size={15} /> Configuración</span><strong>Acceder <ArrowUpRight size={15} /></strong></span></button>}
      </div>
      <p className="dashboard-footnote">Los indicadores se consultan en el backend. Un guion indica que la API no permitió obtener el dato para esa empresa.</p>
      <NoticeDialog notice={notice} onClose={() => setNotice(null)} />
      <CompanyEditorDialog company={creatingCompany ? { id: null, name: 'Nueva empresa' } : editingCompany} isCreate={creatingCompany} form={editForm} setForm={setEditForm} busy={operationBusy} error={operationError} onClose={() => { setEditingCompany(null); setCreatingCompany(false); setOperationError(''); }} onSubmit={saveCompany} />
      <DeleteCompanyDialog company={deletingCompany} busy={operationBusy} error={operationError} onClose={() => { setDeletingCompany(null); setOperationError(''); }} onConfirm={confirmDeleteCompany} />
    </WorkspaceLayout>
  );
}
