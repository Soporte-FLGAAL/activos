import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowUpRight, Building2, Database, Grid2X2, Info, List, Pencil, Settings, ShieldCheck, Trash2, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';
import { getActiveUnitsCount } from '../services/fleetApi';

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
        <div className="company-unit-count">
          <span><TrendingUp size={15} /> Unidades Activas</span>
          <strong>{countStatus === 'loading' ? '…' : countStatus === 'error' ? '—' : Number(count || 0).toLocaleString('es-MX')}</strong>
        </div>
        <div className="company-card-actions">
          <div className="company-action-group">
            {showManagementActions && <>
              <button type="button" title="Edición de empresa (pendiente de conectar)" aria-label={`Editar ${company.name}`} onClick={onEdit}><Pencil size={14} /></button>
              <span className="company-action-separator" />
              <button type="button" title="Eliminación no conectada desde esta tarjeta" aria-label={`Opciones de eliminación para ${company.name}`} onClick={onDelete}><Trash2 size={14} /></button>
            </>}
          </div>
          <button type="button" className="company-info-button" title="Información de empresa" aria-label={`Información de ${company.name}`} onClick={onInfo}><Info size={15} /></button>
        </div>
      </div>
    </article>
  );
}

export default function AppHome() {
  const navigate = useNavigate();
  const { user, companies, activeCompany, selectCompany, isAdminGlobal } = useAuth();
  const [counts, setCounts] = useState({});
  const [viewMode, setViewMode] = useState('grid');
  const [notice, setNotice] = useState(null);

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
    })).then((entries) => {
      if (!cancelled) setCounts(Object.fromEntries(entries));
    });
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

  return (
    <WorkspaceLayout activeNav="home">
      <section className="dashboard-heading-row">
        <div>
          <p className="workspace-eyebrow">ACTIVOS · GESTIÓN MULTIEMPRESA</p>
          <h1>Bienvenido al Panel Principal</h1>
          <p className="workspace-subtitle">Selecciona una empresa para gestionar su flotilla, o accede a los catálogos y la administración.</p>
        </div>
        <div className="workspace-view-toggle" aria-label="Vista de empresas">
          <button type="button" className={viewMode === 'grid' ? 'is-selected' : ''} onClick={() => setViewMode('grid')}><Grid2X2 size={15} /> Grid</button>
          <button type="button" className={viewMode === 'list' ? 'is-selected' : ''} onClick={() => setViewMode('list')}><List size={16} /> Lista</button>
        </div>
      </section>

      {isAdminGlobal && <div className="workspace-global-note"><ShieldCheck size={17} /><span>Administrador global: puedes abrir cualquiera de las empresas asignadas al contexto global. Las operaciones sensibles siguen sujetas a validación del servidor.</span></div>}

      {realCompanies.length === 0 ? (
        <div className="workspace-empty-state"><Building2 size={30} /><h2>No hay empresas disponibles</h2><p>Tu usuario no tiene empresas en el contexto recibido por la API. Contacta al administrador del sistema.</p></div>
      ) : (
        <div className={`dashboard-card-grid${viewMode === 'list' ? ' is-list' : ''}`}>
          {realCompanies.map((company, index) => {
            const currentCount = counts[String(company.id)] || { value: null, status: 'loading' };
            return <CompanyCard
              key={company.id}
              company={company}
              index={index}
              active={String(activeCompany?.id) === String(company.id)}
              count={currentCount.value}
              countStatus={currentCount.status}
              onOpen={() => openCompany(company)}
              onInfo={() => setNotice({ title: company.name, message: 'Información de acceso de esta empresa.', details: `Rol: ${company.roleLabel || company.role || 'Usuario'}\nPermisos recibidos: ${(company.permissions || []).join(', ') || 'No se devolvió una lista de permisos.'}` })}
              onEdit={() => setNotice({ title: 'Editar empresa', message: 'El formulario de edición todavía no está conectado a esta tarjeta. No se ha enviado ninguna modificación al backend.', details: `Empresa seleccionada: ${company.name}` })}
              onDelete={() => setNotice({ title: 'Eliminar empresa', message: 'No se realizó ninguna eliminación. Esta acción no está conectada desde el panel para evitar borrar una empresa o afectar registros relacionados por accidente.', details: 'La eliminación requiere un flujo de confirmación y validación de dependencias.' })}
              showManagementActions={isAdminGlobal || (company.permissions || []).includes('*') || (company.permissions || []).includes('empresas:editar') || (company.permissions || []).includes('empresas:eliminar')}
            />;
          })}

          <button type="button" className="dashboard-shortcut-card" onClick={() => navigate('/catalogos')}>
            <span className="dashboard-shortcut-cover tone-wine"><Database size={33} strokeWidth={1.7} /><strong>Catálogos</strong></span>
            <span className="dashboard-shortcut-body"><span><Activity size={15} /> Tipos de datos</span><strong>Explorar <ArrowUpRight size={15} /></strong></span>
          </button>

          <button type="button" className="dashboard-shortcut-card" onClick={() => navigate('/administracion')}>
            <span className="dashboard-shortcut-cover tone-gray"><Settings size={33} strokeWidth={1.9} /><strong>Administración</strong></span>
            <span className="dashboard-shortcut-body"><span><Settings size={15} /> Configuración</span><strong>Acceder <ArrowUpRight size={15} /></strong></span>
          </button>
        </div>
      )}
      <p className="dashboard-footnote">Los indicadores se consultan en el backend. Un guion indica que la API no permitió obtener el dato para esa empresa.</p>
      <NoticeDialog notice={notice} onClose={() => setNotice(null)} />
    </WorkspaceLayout>
  );
}
