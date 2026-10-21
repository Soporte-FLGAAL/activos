import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowUpRight, Building2, Database, Grid2X2, Info, List, Pencil, Settings, ShieldCheck, Trash2, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';
import { getActiveUnitsCount } from '../services/fleetApi';
import { deleteCompany, updateCompany } from '../services/companyApi';

const CARD_TONES = ['red', 'wine', 'gray', 'charcoal', 'red'];

function initials(label) {
  return String(label || 'GAAL').trim().split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'GA';
}

function NoticeDialog({ notice, onClose }) {
  if (!notice) return null;
  return (
    <div className="workspace-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="workspace-modal" role="dialog" aria-modal="true" aria-labelledby="notice-title">
        <button className="workspace-modal-close" type="button" aria-label="Cerrar" onClick={onClose}>×</button>
        <div className="workspace-modal-icon"><Info size={20} /></div>
        <h2 id="notice-title">{notice.title}</h2>
        <p>{notice.message}</p>
        {notice.details && <div className="workspace-modal-details">{notice.details}</div>}
        <button type="button" className="workspace-primary-button" onClick={onClose}>Entendido</button>
      </section>
    </div>
  );
}

function CompanyEditorDialog({ company, form, setForm, busy, error, onClose, onSubmit }) {
  if (!company) return null;
  return (
    <div className="workspace-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <form className="workspace-modal company-editor-modal" role="dialog" aria-modal="true" aria-labelledby="company-editor-title" onSubmit={onSubmit}>
        <button className="workspace-modal-close" type="button" aria-label="Cerrar" disabled={busy} onClick={onClose}>×</button>
        <div className="workspace-modal-icon"><Building2 size={20} /></div>
        <h2 id="company-editor-title">Editar empresa</h2>
        <p>Los cambios se guardarán en la empresa del backend.</p>
        <label className="company-form-label">Nombre de empresa<input value={form.nombre} maxLength={100} required onChange={(event) => setForm((old) => ({ ...old, nombre: event.target.value }))} /></label>
        <label className="company-form-label">Nombre corto<input value={form.nombreCorto} maxLength={20} onChange={(event) => setForm((old) => ({ ...old, nombreCorto: event.target.value }))} /></label>
        <label className="company-form-label">Dirección<input value={form.direccion} maxLength={150} onChange={(event) => setForm((old) => ({ ...old, direccion: event.target.value }))} /></label>
        <label className="company-form-label">RFC<input value={form.rfc} maxLength={13} minLength={12} required onChange={(event) => setForm((old) => ({ ...old, rfc: event.target.value.toUpperCase() }))} /></label>
        {error && <div className="workspace-error" role="alert">{error}</div>}
        <div className="company-form-actions"><button type="button" className="workspace-secondary-button" disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className="workspace-primary-button" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</button></div>
      </form>
    </div>
  );
}

function DeleteCompanyDialog({ company, busy, error, onClose, onConfirm }) {
  if (!company) return null;
  return (
    <div className="workspace-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section className="workspace-modal" role="dialog" aria-modal="true" aria-labelledby="delete-company-title">
        <button className="workspace-modal-close" type="button" aria-label="Cerrar" disabled={busy} onClick={onClose}>×</button>
        <div className="workspace-modal-icon"><Trash2 size={20} /></div>
        <h2 id="delete-company-title">Eliminar empresa</h2>
        <p>Se solicitará al backend eliminar <strong>{company.name}</strong>. La base de datos puede rechazarlo si existen unidades, usuarios u otros registros relacionados.</p>
        {error && <div className="workspace-error" role="alert">{error}</div>}
        <div className="company-form-actions"><button type="button" className="workspace-secondary-button" disabled={busy} onClick={onClose}>Cancelar</button><button type="button" className="workspace-danger-button" disabled={busy} onClick={onConfirm}>{busy ? 'Eliminando…' : 'Confirmar eliminación'}</button></div>
      </section>
    </div>
  );
}

function CompanyCard({ company, index, active, count, countStatus, onOpen, onInfo, onEdit, onDelete, showManagementActions }) {
  return (
    <article className="dashboard-company-card">
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
          <button type="button" className="company-info-button" title="Información de empresa" aria-label={`Información de ${company.name}`} onClick={onInfo}><Info size={15} /></button>
        </div>
      </div>
    </article>
  );
}

export default function AppHome() {
  const navigate = useNavigate();
  const { companies, activeCompany, selectCompany, isAdminGlobal, patchCompany, removeCompany } = useAuth();
  const [counts, setCounts] = useState({});
  const [viewMode, setViewMode] = useState('grid');
  const [notice, setNotice] = useState(null);
  const [editingCompany, setEditingCompany] = useState(null);
  const [deletingCompany, setDeletingCompany] = useState(null);
  const [editForm, setEditForm] = useState({ nombre: '', nombreCorto: '', direccion: '', rfc: '' });
  const [operationBusy, setOperationBusy] = useState(false);
  const [operationError, setOperationError] = useState('');

  const realCompanies = useMemo(() => companies.filter((company) => company.scope !== 'global' && company.id != null), [companies]);

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

  function beginEdit(company) {
    setOperationError('');
    setEditForm({ nombre: company.name || '', nombreCorto: company.shortName || '', direccion: company.address || '', rfc: company.rfc || '' });
    setEditingCompany(company);
  }

  async function saveCompany(event) {
    event.preventDefault();
    if (!editingCompany) return;
    setOperationError('');
    setOperationBusy(true);
    try {
      const updated = await updateCompany(editingCompany.id, editForm);
      patchCompany(editingCompany.id, {
        name: updated?.Emp_nombre ?? editForm.nombre,
        shortName: updated?.Emp_nombre_corto ?? editForm.nombreCorto,
        address: updated?.Emp_direccion ?? editForm.direccion,
        rfc: updated?.Emp_rfc ?? editForm.rfc,
      });
      setEditingCompany(null);
      setNotice({ title: 'Empresa actualizada', message: 'La información se guardó correctamente en el backend.' });
    } catch (error) {
      setOperationError(error.message || 'No se pudo actualizar la empresa.');
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
        <div><p className="workspace-eyebrow">ACTIVOS · GESTIÓN MULTIEMPRESA</p><h1>Bienvenido al Panel Principal</h1><p className="workspace-subtitle">Selecciona una empresa para gestionar su flotilla, o accede a los catálogos y la administración.</p></div>
        <div className="workspace-view-toggle" aria-label="Vista de empresas"><button type="button" className={viewMode === 'grid' ? 'is-selected' : ''} onClick={() => setViewMode('grid')}><Grid2X2 size={15} /> Grid</button><button type="button" className={viewMode === 'list' ? 'is-selected' : ''} onClick={() => setViewMode('list')}><List size={16} /> Lista</button></div>
      </section>

      {isAdminGlobal && <div className="workspace-global-note"><ShieldCheck size={17} /><span>Administrador global: se muestran las empresas registradas. Los permisos y las operaciones se validan en el servidor.</span></div>}

      {realCompanies.length === 0 ? <div className="workspace-empty-state"><Building2 size={30} /><h2>No hay empresas disponibles</h2><p>Tu usuario no tiene empresas en el contexto recibido por la API. Contacta al administrador del sistema.</p></div> : <div className={`dashboard-card-grid${viewMode === 'list' ? ' is-list' : ''}`}>
        {realCompanies.map((company, index) => {
          const currentCount = counts[String(company.id)] || { value: null, status: 'loading' };
          return <CompanyCard key={company.id} company={company} index={index} active={String(activeCompany?.id) === String(company.id)} count={currentCount.value} countStatus={currentCount.status} onOpen={() => openCompany(company)} onInfo={() => setNotice({ title: company.name, message: 'Información de acceso de esta empresa.', details: `Rol asignado: ${company.roleLabel || company.role || 'Usuario'}\nLa API actual no devuelve permisos detallados en /auth/me. El backend valida cada operación.` })} onEdit={() => beginEdit(company)} onDelete={() => { setOperationError(''); setDeletingCompany(company); }} showManagementActions={isAdminGlobal} />;
        })}

        <button type="button" className="dashboard-shortcut-card" onClick={() => navigate('/catalogos')}><span className="dashboard-shortcut-cover tone-wine"><Database size={33} strokeWidth={1.7} /><strong>Catálogos</strong></span><span className="dashboard-shortcut-body"><span><Activity size={15} /> Tipos de datos</span><strong>Explorar <ArrowUpRight size={15} /></strong></span></button>
        <button type="button" className="dashboard-shortcut-card" onClick={() => navigate('/administracion')}><span className="dashboard-shortcut-cover tone-gray"><Settings size={33} strokeWidth={1.9} /><strong>Administración</strong></span><span className="dashboard-shortcut-body"><span><Settings size={15} /> Configuración</span><strong>Acceder <ArrowUpRight size={15} /></strong></span></button>
      </div>}
      <p className="dashboard-footnote">Los indicadores se consultan en el backend. Un guion indica que la API no permitió obtener el dato para esa empresa.</p>
      <NoticeDialog notice={notice} onClose={() => setNotice(null)} />
      <CompanyEditorDialog company={editingCompany} form={editForm} setForm={setEditForm} busy={operationBusy} error={operationError} onClose={() => { setEditingCompany(null); setOperationError(''); }} onSubmit={saveCompany} />
      <DeleteCompanyDialog company={deletingCompany} busy={operationBusy} error={operationError} onClose={() => { setDeletingCompany(null); setOperationError(''); }} onConfirm={confirmDeleteCompany} />
    </WorkspaceLayout>
  );
}
