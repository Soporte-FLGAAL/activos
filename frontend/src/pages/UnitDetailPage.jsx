import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, CalendarDays, CarFront, ChevronDown, ChevronUp, ClipboardList, FileText, Info, LayoutList, Wrench } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';
import {
  getCirculationCards,
  getCotejos,
  getDoubleArticulatedPermits,
  getEndorsements,
  getIncisos,
  getPolicies,
  getSictPermits,
  getUnitById,
} from '../services/fleetApi';

const SECTIONS = [
  { id: 'general', label: 'General', Icon: Info },
  { id: 'documents', label: 'Documentos', Icon: FileText },
  { id: 'maintenance', label: 'Mantenimiento', Icon: Wrench },
];

function dateText(value) {
  if (!value) return '—';
  const raw = String(value).slice(0, 10);
  const [year, month, day] = raw.split('-');
  return year && month && day ? `${day}/${month}/${year}` : raw;
}

function moneyText(value) {
  if (value == null || value === '') return '—';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return String(value);
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function ValueCard({ label, value, variant = '' }) {
  return <div className={`unit-detail-value-card ${variant}`}><span>{label}</span><strong>{value == null || value === '' ? '—' : String(value)}</strong></div>;
}

function DocumentLink({ href, children = 'Ver documento' }) {
  if (!href) return <span className="registry-muted">Sin archivo adjunto</span>;
  return <a className="unit-document-link" href={href} target="_blank" rel="noreferrer noopener">{children}</a>;
}

function DocumentRow({ title, subtitle, meta, href, children }) {
  return (
    <article className="unit-document-row">
      <span className="unit-document-icon"><FileText size={17} /></span>
      <div className="unit-document-copy"><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}{meta && <small>{meta}</small>}{children}</div>
      <DocumentLink href={href} />
    </article>
  );
}

function GeneralSection({ unit, cards }) {
  const firstCard = cards[0];
  const fields = [
    ['PLacas'.toUpperCase(), firstCard?.Pla_placas],
    ['NO TC', firstCard?.TC_tarjeta],
    ['PROPIETARIO', unit.propietario_nombre],
    ['MARCA', unit.Uni_marca],
    ['MODELO', unit.Uni_anio_modelo || unit.Uni_modelo],
  ];
  const extra = [
    ['No. económico', unit.Uni_no_economico],
    ['Tipo de unidad', unit.tipo_nombre],
    ['Estado operativo', unit.estado_nombre],
    ['Empresa actual', unit.empresa_nombre],
    ['Combustible', unit.combustible_nombre],
    ['Número de serie', unit.Uni_no_serie],
    ['Número de motor', unit.Uni_no_motor],
    ['Ejes', unit.Uni_ejes],
    ['Llantas', unit.Uni_llantas],
    ['ViaPass', unit.Uni_viapass],
  ];
  return (
    <div className="unit-detail-section-body">
      <div className="unit-detail-value-grid">{fields.map(([label, value]) => <ValueCard key={label} label={label} value={value} />)}</div>
      <h3 className="unit-detail-subheading">Información de la unidad</h3>
      <div className="unit-detail-value-grid unit-detail-extra-grid">{extra.map(([label, value]) => <ValueCard key={label} label={label} value={value} />)}</div>
      {cards.length > 1 && <p className="registry-muted-note">Esta unidad tiene {cards.length} tarjetas de circulación asociadas. Consulta todos los registros en Documentos.</p>}
    </div>
  );
}

function DocumentsSection({ documents, warnings }) {
  const { cards, policies, doublePermits, sictPermits, cotejosByCard } = documents;
  const hasAny = cards.length || policies.length || doublePermits.length || sictPermits.length;
  return (
    <div className="unit-detail-section-body">
      {warnings.length > 0 && <div className="workspace-error unit-detail-warning"><AlertCircle size={18} /><span>Algunos documentos no se pudieron consultar por permisos o errores del endpoint. Los apartados disponibles sí se muestran.</span></div>}
      {!hasAny ? <div className="workspace-empty-state unit-document-empty"><FileText size={27} /><h2>Sin documentos disponibles</h2><p>No se encontraron documentos asociados o el usuario no tiene permisos para consultarlos.</p></div> : <div className="unit-document-groups">
        <section className="unit-document-group">
          <div className="unit-detail-subhead-row"><h3>Tarjetas de circulación</h3><span>{cards.length}</span></div>
          {cards.length === 0 ? <p className="registry-muted">No hay tarjetas de circulación registradas para esta unidad.</p> : cards.map((card) => (
            <div className="unit-document-composite" key={`tc-${card.TC_id}`}>
              <DocumentRow title={`Tarjeta ${card.TC_tarjeta || card.TC_id}`} subtitle={`Placas: ${card.Pla_placas || '—'} · Estado: ${card.TC_status || '—'}`} meta={`Obtenida: ${dateText(card.TC_fecha_obtencion)} · Vencimiento: ${dateText(card.TC_fecha_vencimiento)}`} href={card.TC_url} />
              {card.TC_url_reposicion && <div className="unit-document-nested"><DocumentLink href={card.TC_url_reposicion}>Documento de reposición</DocumentLink></div>}
              {cotejosByCard[card.TC_id]?.length > 0 && <div className="unit-document-nested"><strong>Cotejos registrados</strong>{cotejosByCard[card.TC_id].map((cotejo) => <div key={cotejo.Cot_id} className="unit-document-nested-row"><span>{cotejo.Cot_tarjeta_cotejo}</span><small>{dateText(cotejo.Cot_fecha)}</small></div>)}</div>}
            </div>
          ))}
        </section>

        <section className="unit-document-group">
          <div className="unit-detail-subhead-row"><h3>Pólizas, endosos e incisos</h3><span>{policies.length}</span></div>
          {policies.length === 0 ? <p className="registry-muted">No hay pólizas asociadas a esta unidad.</p> : policies.map((policy) => (
            <div className="unit-document-composite" key={`pol-${policy.Pol_id}`}>
              <DocumentRow title={`Póliza ${policy.Pol_poliza || policy.Pol_id}`} subtitle={`${policy.aseguradora_nombre || 'Aseguradora'} · ${policy.tipo_poliza_nombre || 'Tipo de póliza'}`} meta={`Vigencia: ${dateText(policy.Pol_fecha_inicio)} al ${dateText(policy.Pol_fecha_fin)} · Costo: ${moneyText(policy.Pol_costo)}`} href={policy.Pol_url} />
              {(policy.endosos || []).length > 0 && <div className="unit-document-nested">
                {(policy.endosos || []).map((endorsement) => <div key={`end-${endorsement.End_id}`} className="unit-document-nested-block">
                  <div className="unit-document-nested-row"><strong>Endoso {endorsement.End_endoso}</strong><DocumentLink href={endorsement.End_url} /></div>
                  {(endorsement.incisos || []).length > 0 && <div className="unit-document-incisos">{endorsement.incisos.map((inciso) => <div key={`inc-${inciso.Inc_id}`} className="unit-document-nested-row"><span>Inciso {inciso.Inc_inciso}</span><DocumentLink href={inciso.Inc_url} /></div>)}</div>}
                </div>)}
              </div>}
              {policy.endososError && <p className="registry-muted-note">No se pudieron consultar endosos/incisos de esta póliza.</p>}
            </div>
          ))}
        </section>

        <section className="unit-document-group">
          <div className="unit-detail-subhead-row"><h3>Permisos especiales</h3><span>{doublePermits.length + sictPermits.length}</span></div>
          {doublePermits.map((permit) => <DocumentRow key={`da-${permit.PDA_id}`} title={`Doble articulado: ${permit.PDA_permiso}`} meta={`Obtención: ${dateText(permit.PDA_fecha_obtencion)} · Vencimiento: ${dateText(permit.PDA_fecha_vencimiento)}`} href={permit.PDA_url} />)}
          {sictPermits.map((permit) => <DocumentRow key={`sict-${permit.SICT_id}`} title={`SICT: ${permit.SICT_permiso}`} meta={`Obtención: ${dateText(permit.SICT_fecha_obtencion)} · Vencimiento: ${dateText(permit.SICT_fecha_vencimiento)}`} href={permit.SICT_url} />)}
          {doublePermits.length + sictPermits.length === 0 && <p className="registry-muted">No hay permisos especiales asociados.</p>}
        </section>
      </div>}
    </div>
  );
}

function MaintenanceSection({ unit }) {
  const items = [
    { title: 'Verificación mecánica', date: unit.Uni_fecha_verificacion_mecanica, cost: unit.Uni_costo_verificacion_mecanica, period: unit.periodo_mecanica || unit.Uni_periodo_verificacion_mecanica, href: unit.Uni_url_verificacion_mecanica },
    { title: 'Verificación de contaminantes', date: unit.Uni_fecha_verificacion_contaminantes, cost: unit.Uni_costo_verificacion_contaminantes, period: unit.periodo_contaminantes || unit.Uni_periodo_verificacion_contaminantes, href: unit.Uni_url_verificacion_contaminantes },
  ];
  return (
    <div className="unit-detail-section-body">
      <p className="registry-muted-note">Se muestra el registro vigente de cada verificación. No se presenta historial porque el modelo actual conserva un solo registro por unidad.</p>
      <div className="maintenance-cards">
        {items.map((item) => <article className="maintenance-card" key={item.title}>
          <div className="maintenance-card-title"><span><CalendarDays size={18} /></span><h3>{item.title}</h3></div>
          <div className="unit-detail-value-grid">
            <ValueCard label="FECHA" value={dateText(item.date)} />
            <ValueCard label="COSTO" value={moneyText(item.cost)} />
            <ValueCard label="PERIODO" value={item.period} />
          </div>
          <DocumentLink href={item.href}>Comprobante de verificación</DocumentLink>
        </article>)}
      </div>
      <div className="unit-detail-value-grid unit-detail-extra-grid">
        <ValueCard label="ALTA SCT" value={dateText(unit.Uni_fecha_alta_SCT)} />
        <ValueCard label="VALOR DE FACTURA" value={moneyText(unit.Uni_valor_factura)} />
      </div>
      <div className="maintenance-invoice-row"><span><ClipboardList size={16} /> Factura de la unidad</span><DocumentLink href={unit.Uni_factura_url} /></div>
    </div>
  );
}

export default function UnitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeCompany } = useAuth();
  const [unit, setUnit] = useState(null);
  const [documents, setDocuments] = useState({ cards: [], policies: [], doublePermits: [], sictPermits: [], cotejosByCard: {} });
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [layoutMode, setLayoutMode] = useState('accordion');
  const [activeTab, setActiveTab] = useState('general');
  const [expanded, setExpanded] = useState({ general: true, documents: false, maintenance: false });

  useEffect(() => {
    if (!activeCompany?.id) return undefined;
    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      setWarnings([]);
      try {
        const [unitResult, cardsResult, policiesResult, doubleResult, sictResult] = await Promise.allSettled([
          getUnitById(id, { signal: controller.signal }),
          getCirculationCards({ unidadId: id, limit: 100 }, { signal: controller.signal }),
          getPolicies({ unidadId: id, limit: 100 }, { signal: controller.signal }),
          getDoubleArticulatedPermits({ unidadId: id, limit: 100 }, { signal: controller.signal }),
          getSictPermits({ unidadId: id, limit: 100 }, { signal: controller.signal }),
        ]);
        if (unitResult.status === 'rejected') throw unitResult.reason;
        if (cancelled) return;
        setUnit(unitResult.value);

        const warns = [];
        const cards = cardsResult.status === 'fulfilled' ? cardsResult.value : (warns.push('tarjetas'), []);
        const policies = policiesResult.status === 'fulfilled' ? policiesResult.value : (warns.push('pólizas'), []);
        const doublePermits = doubleResult.status === 'fulfilled' ? doubleResult.value : (warns.push('doble articulado'), []);
        const sictPermits = sictResult.status === 'fulfilled' ? sictResult.value : (warns.push('SICT'), []);

        const policiesWithEndorsements = await Promise.all(policies.map(async (policy) => {
          try {
            const endosos = await getEndorsements({ polizaId: policy.Pol_id, limit: 100 }, { signal: controller.signal });
            const endososWithIncisos = await Promise.all(endosos.map(async (endorsement) => {
              try {
                const incisos = await getIncisos({ endosoId: endorsement.End_id, limit: 100 }, { signal: controller.signal });
                return { ...endorsement, incisos };
              } catch {
                return { ...endorsement, incisos: [], incisosError: true };
              }
            }));
            return { ...policy, endosos: endososWithIncisos };
          } catch {
            return { ...policy, endosos: [], endososError: true };
          }
        }));

        const cotejosEntries = await Promise.all(cards.map(async (card) => {
          try {
            const rows = await getCotejos({ tarjetaId: card.TC_id, limit: 100 }, { signal: controller.signal });
            return [card.TC_id, rows];
          } catch {
            warns.push('cotejos');
            return [card.TC_id, []];
          }
        }));

        if (!cancelled) {
          setDocuments({ cards, policies: policiesWithEndorsements, doublePermits, sictPermits, cotejosByCard: Object.fromEntries(cotejosEntries) });
          setWarnings([...new Set(warns)]);
        }
      } catch (requestError) {
        if (!cancelled && requestError.name !== 'AbortError') setError(requestError.message || 'No fue posible obtener el detalle de la unidad.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; controller.abort(); };
  }, [id, activeCompany?.id]);

  const unitName = useMemo(() => unit?.Uni_no_economico || id, [unit, id]);

  if (!activeCompany?.id) return <Navigate to="/seleccionar-empresa" replace state={{ from: `/unidades/${id}` }} />;

  function renderSection(sectionId) {
    if (!unit) return null;
    if (sectionId === 'general') return <GeneralSection unit={unit} cards={documents.cards} />;
    if (sectionId === 'documents') return <DocumentsSection documents={documents} warnings={warnings} />;
    return <MaintenanceSection unit={unit} />;
  }

  function toggleSection(sectionId) {
    setExpanded((current) => ({ ...current, [sectionId]: !current[sectionId] }));
  }

  return (
    <WorkspaceLayout activeNav="units">
      <section className="unit-detail-page-heading">
        <button type="button" className="unit-detail-back" onClick={() => navigate('/unidades')} aria-label="Volver al catálogo"><ArrowLeft size={19} /></button>
        <div className="unit-detail-title-group"><div className="unit-detail-title-row"><h1>Unidad {unitName}</h1>{unit?.tipo_nombre && <span className="unit-type-pill">{unit.tipo_nombre}</span>}</div><p className="workspace-subtitle">Detalles y administración del vehículo{activeCompany ? ` · ${activeCompany.name}` : ''}</p></div>
        <div className="unit-detail-mode-toggle" aria-label="Modo de presentación">
          <button type="button" className={layoutMode === 'accordion' ? 'is-selected' : ''} onClick={() => setLayoutMode('accordion')}><LayoutList size={15} /> Acordeón</button>
          <button type="button" className={layoutMode === 'tabs' ? 'is-selected' : ''} onClick={() => setLayoutMode('tabs')}><CarFront size={15} /> Pestañas</button>
        </div>
      </section>

      {loading && <div className="workspace-loading">Cargando detalle y documentos…</div>}
      {!loading && error && <div className="workspace-error"><AlertCircle size={18} /><span>{error}</span><button type="button" onClick={() => window.location.reload()}>Reintentar</button></div>}
      {!loading && !error && unit && layoutMode === 'accordion' && <div className="unit-detail-accordion">
        {SECTIONS.map(({ id: sectionId, label, Icon }) => <section className="unit-detail-section" key={sectionId}>
          <button type="button" className="unit-detail-section-header" aria-expanded={Boolean(expanded[sectionId])} onClick={() => toggleSection(sectionId)}>
            <span className="unit-detail-section-icon"><Icon size={18} /></span><strong>{label}</strong>{expanded[sectionId] ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
          </button>
          {expanded[sectionId] && renderSection(sectionId)}
        </section>)}
      </div>}
      {!loading && !error && unit && layoutMode === 'tabs' && <div className="unit-detail-tabs-container">
        <div className="unit-detail-tablist" role="tablist" aria-label="Secciones de la unidad">
          {SECTIONS.map(({ id: sectionId, label, Icon }) => <button type="button" role="tab" aria-selected={activeTab === sectionId} className={activeTab === sectionId ? 'is-selected' : ''} key={sectionId} onClick={() => setActiveTab(sectionId)}><Icon size={16} /> {label}</button>)}
        </div>
        <section className="unit-detail-section unit-detail-tab-panel">{renderSection(activeTab)}</section>
      </div>}
    </WorkspaceLayout>
  );
}
