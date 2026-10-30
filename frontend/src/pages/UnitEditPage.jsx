import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BadgeCheck, CheckCircle2, CircleAlert, ClipboardList, FileUp, FileText, Save, ShieldCheck, Truck, X } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';
import { listRecords, uploadDocument } from '../services/creationApi';
import { apiRequest } from '../services/apiClient';
import { getUnitById, updateUnit } from '../services/fleetApi';
import '../styles/create-record.css';

const EDIT_TABS = [
  { id: 'unidad', label: 'Unidad', icon: Truck },
  { id: 'placas', label: 'Placas', icon: BadgeCheck },
  { id: 'tarjetas', label: 'Tarjetas', icon: ClipboardList },
  { id: 'polizas', label: 'Pólizas', icon: FileText },
  { id: 'doble', label: 'Doble articulado', icon: Truck },
  { id: 'sict', label: 'SICT', icon: ShieldCheck },
];

function todayValue(value) {
  if (!value) return '';
  const raw = String(value);
  return raw.length >= 10 ? raw.slice(0, 10) : raw;
}

function unitFormFromApi(unit) {
  return {
    noEconomico: unit?.Uni_no_economico ?? '',
    status: unit?.Uni_status ?? 'ALTA',
    tipoId: String(unit?.Uni_tipo ?? ''),
    estadoId: String(unit?.Uni_estado ?? ''),
    combustibleId: String(unit?.Uni_combustible ?? ''),
    noSerie: unit?.Uni_no_serie ?? '',
    noMotor: unit?.Uni_no_motor ?? '',
    anioModelo: String(unit?.Uni_anio_modelo ?? ''),
    modelo: unit?.Uni_modelo ?? '',
    marca: unit?.Uni_marca ?? '',
    ejes: unit?.Uni_ejes == null ? '' : String(unit.Uni_ejes),
    llantas: String(unit?.Uni_llantas ?? ''),
    viapass: unit?.Uni_viapass ?? '',
    fechaAltaSCT: todayValue(unit?.Uni_fecha_alta_SCT),
    valorFactura: unit?.Uni_valor_factura == null ? '' : String(unit.Uni_valor_factura),
    fechaVerificacionMecanica: todayValue(unit?.Uni_fecha_verificacion_mecanica),
    costoVerificacionMecanica: String(unit?.Uni_costo_verificacion_mecanica ?? ''),
    periodoVerificacionMecanicaId: String(unit?.Uni_periodo_verificacion_mecanica ?? ''),
    fechaVerificacionContaminantes: todayValue(unit?.Uni_fecha_verificacion_contaminantes),
    costoVerificacionContaminantes: String(unit?.Uni_costo_verificacion_contaminantes ?? ''),
    periodoVerificacionContaminantesId: String(unit?.Uni_periodo_verificacion_contaminantes ?? ''),
  };
}

function Field({ label, children, required = false, hint }) {
  return <label className="create-field"><span>{label}{required && <b aria-hidden="true"> *</b>}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function TextInput({ value, onChange, type = 'text', required = false, min, max, step, maxLength }) {
  return <input value={value ?? ''} onChange={(event) => onChange(event.target.value)} type={type} required={required} min={min} max={max} step={step} maxLength={maxLength} />;
}

function SelectInput({ value, onChange, options, required = false }) {
  return <select value={value ?? ''} onChange={(event) => onChange(event.target.value)} required={required}>
    <option value="">Selecciona una opción</option>
    {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
  </select>;
}

function SectionTitle({ icon: Icon = ClipboardList, title, subtitle }) {
  return <div className="create-section-title"><span><Icon size={18} /></span><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div></div>;
}

function ExistingFile({ label, url, file, onChange }) {
  return <Field label={label} hint={file?.name || (url ? 'Ya existe un documento asociado. Déjalo vacío para conservarlo.' : 'No hay un documento asociado.')}>
    <input className="create-file-input" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => onChange(event.target.files?.[0] || null)} />
  </Field>;
}

function absoluteFileUrl(uploaded) {
  return uploaded?.url || null;
}

function RelatedRecordEditor({ record, recordId, title, fields, canEdit, onSave, refreshKey }) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((field) => [
    field.key,
    field.type === 'date' ? todayValue(record?.[field.source]) : (record?.[field.source] == null ? '' : String(record[field.source])),
  ])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {};
    fields.forEach((field) => {
      const value = values[field.key] ?? '';
      if (field.serialize === 'number') payload[field.key] = value === '' ? null : Number(value);
      else if (field.serialize === 'nullable') payload[field.key] = String(value).trim() || null;
      else if (field.type === 'date' && field.nullable) payload[field.key] = value || null;
      else payload[field.key] = value;
    });
    try {
      await onSave(payload);
      setEditing(false);
    } catch (requestError) {
      setError(requestError.message || 'No se pudo actualizar el registro.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="unit-related-record">
      <header className="unit-related-record-heading">
        <strong>{title}</strong>
        {canEdit && !editing && <button type="button" className="unit-card-action" onClick={() => setEditing(true)}>Editar</button>}
      </header>
      {editing ? (
        <form onSubmit={submit}>
          <div className="create-form-grid unit-related-fields">
            {fields.map((field) => <Field key={field.key} label={field.label} required={field.required}>
              {field.options
                ? <SelectInput value={values[field.key]} onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))} options={field.options} required={field.required} />
                : <TextInput type={field.type || 'text'} value={values[field.key]} onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))} required={field.required} min={field.min} max={field.max} maxLength={field.maxLength} step={field.step} />}
            </Field>)}
          </div>
          {error && <div className="create-alert is-error" role="alert"><CircleAlert size={16} /><p>{error}</p></div>}
          <div className="create-form-actions unit-related-actions">
            <button type="button" className="workspace-secondary-button" onClick={() => { setEditing(false); setError(''); }} disabled={saving}>Cancelar</button>
            <button type="submit" className="workspace-primary-button" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
          </div>
        </form>
      ) : (
        <dl className="unit-related-summary">
          {fields.map((field) => <div key={field.key}><dt>{field.label}</dt><dd>{record?.[field.source] == null || record?.[field.source] === '' ? '—' : (field.type === 'date' ? todayValue(record[field.source]) : String(record[field.source]))}</dd></div>)}
        </dl>
      )}
    </article>
  );
}

export default function UnitEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeCompany, isAdminGlobal, can } = useAuth();
  const [unit, setUnit] = useState(null);
  const [form, setForm] = useState(null);
  const [lookups, setLookups] = useState({ types: [], states: [], fuels: [], periods: [], movementTypes: [], cardTypes: [], policyTypes: [], insurers: [] });
  const [files, setFiles] = useState({ invoice: null, mechanical: null, contaminants: null });
  const [loading, setLoading] = useState(true);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeEditTab, setActiveEditTab] = useState('unidad');
  const [related, setRelated] = useState({ plates: [], movements: [], cards: [], policies: [], doublePermits: [], sictPermits: [] });
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [relatedError, setRelatedError] = useState('');
  const [relatedRefresh, setRelatedRefresh] = useState(0);

  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const setFile = (key) => (file) => setFiles((current) => ({ ...current, [key]: file }));
  const companyOptions = useMemo(() => ({ company: false }), []);

  useEffect(() => {
    if (!activeCompany?.id && !isAdminGlobal) return undefined;
    const controller = new AbortController();
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const result = await getUnitById(id, { signal: controller.signal });
        if (cancelled) return;
        setUnit(result);
        setForm(unitFormFromApi(result));
      } catch (requestError) {
        if (!cancelled && requestError.name !== 'AbortError') setError(requestError.message || 'No fue posible consultar la unidad.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; controller.abort(); };
  }, [id, activeCompany?.id, isAdminGlobal]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    async function loadLookups() {
      setLoadingLookups(true);
      setLookupError('');
      try {
        const [types, states, fuels, periods] = await Promise.all([
          listRecords('/catalogos/tipo-unidad', {}, { ...companyOptions, signal: controller.signal }),
          listRecords('/catalogos/estado-unidad', {}, { ...companyOptions, signal: controller.signal }),
          listRecords('/catalogos/combustible', {}, { ...companyOptions, signal: controller.signal }),
          listRecords('/catalogos/periodos', {}, { ...companyOptions, signal: controller.signal }),
        ]);
        if (cancelled) return;
        setLookups({
          types: types.items.map((row) => ({ value: String(row.TpU_id), label: row.TpU_nombre })),
          states: states.items.map((row) => ({ value: String(row.EsU_id), label: row.EsU_estado })),
          fuels: fuels.items.map((row) => ({ value: String(row.Com_id), label: row.Com_nombre })),
          periods: periods.items.map((row) => ({ value: String(row.Per_id), label: row.Per_nombre })),
        });
      } catch (requestError) {
        if (!cancelled && requestError.name !== 'AbortError') setLookupError(requestError.message || 'No fue posible cargar los catálogos.');
      } finally {
        if (!cancelled) setLoadingLookups(false);
      }
    }
    loadLookups();
    return () => { cancelled = true; controller.abort(); };
  }, [companyOptions]);

  async function uploadReplacement(file, type, metadata) {
    if (!file) return null;
    return uploadDocument(file, type, activeCompany?.id ?? unit?.Uni_empresa_actual, { metadata });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!form || !unit) return;
    setSubmitting(true);
    try {
      const noEconomico = form.noEconomico.trim();
      const [invoice, mechanical, contaminants] = await Promise.all([
        uploadReplacement(files.invoice, 'factura', { identificador: noEconomico }),
        uploadReplacement(files.mechanical, 'verificacion_mecanica', { noEconomico, verificacionTipo: 'mecanica' }),
        uploadReplacement(files.contaminants, 'verificacion_contaminantes', { noEconomico, verificacionTipo: 'contaminantes' }),
      ]);

      const payload = {
        noEconomico,
        status: form.status,
        tipoId: Number(form.tipoId),
        estadoId: Number(form.estadoId),
        combustibleId: Number(form.combustibleId),
        noSerie: form.noSerie.trim() || null,
        noMotor: form.noMotor.trim() || null,
        anioModelo: Number(form.anioModelo),
        modelo: form.modelo.trim(),
        marca: form.marca.trim(),
        ejes: form.ejes.trim() === '' ? null : Number(form.ejes),
        llantas: Number(form.llantas),
        viapass: form.viapass.trim() || null,
        fechaAltaSCT: form.fechaAltaSCT,
        valorFactura: form.valorFactura.trim() === '' ? null : Number(form.valorFactura),
        fechaVerificacionMecanica: form.fechaVerificacionMecanica,
        costoVerificacionMecanica: Number(form.costoVerificacionMecanica),
        periodoVerificacionMecanicaId: Number(form.periodoVerificacionMecanicaId),
        fechaVerificacionContaminantes: form.fechaVerificacionContaminantes,
        costoVerificacionContaminantes: Number(form.costoVerificacionContaminantes),
        periodoVerificacionContaminantesId: Number(form.periodoVerificacionContaminantesId),
      };
      if (invoice) payload.facturaUrl = absoluteFileUrl(invoice);
      if (mechanical) payload.urlVerificacionMecanica = absoluteFileUrl(mechanical);
      if (contaminants) payload.urlVerificacionContaminantes = absoluteFileUrl(contaminants);

      await updateUnit(id, payload);
      setSuccess(`Unidad ${noEconomico} actualizada correctamente.`);
      setUnit((current) => ({
        ...current,
        Uni_no_economico: payload.noEconomico,
        Uni_status: payload.status,
        Uni_tipo: payload.tipoId,
        Uni_estado: payload.estadoId,
        Uni_combustible: payload.combustibleId,
        Uni_no_serie: payload.noSerie,
        Uni_no_motor: payload.noMotor,
        Uni_anio_modelo: payload.anioModelo,
        Uni_modelo: payload.modelo,
        Uni_marca: payload.marca,
        Uni_ejes: payload.ejes,
        Uni_llantas: payload.llantas,
        Uni_viapass: payload.viapass,
        Uni_fecha_alta_SCT: payload.fechaAltaSCT,
        Uni_valor_factura: payload.valorFactura,
        Uni_fecha_verificacion_mecanica: payload.fechaVerificacionMecanica,
        Uni_costo_verificacion_mecanica: payload.costoVerificacionMecanica,
        Uni_periodo_verificacion_mecanica: payload.periodoVerificacionMecanicaId,
        Uni_fecha_verificacion_contaminantes: payload.fechaVerificacionContaminantes,
        Uni_costo_verificacion_contaminantes: payload.costoVerificacionContaminantes,
        Uni_periodo_verificacion_contaminantes: payload.periodoVerificacionContaminantesId,
        ...(invoice ? { Uni_factura_url: payload.facturaUrl } : {}),
        ...(mechanical ? { Uni_url_verificacion_mecanica: payload.urlVerificacionMecanica } : {}),
        ...(contaminants ? { Uni_url_verificacion_contaminantes: payload.urlVerificacionContaminantes } : {}),
      }));
      setFiles({ invoice: null, mechanical: null, contaminants: null });
    } catch (requestError) {
      setError(requestError.message || 'No fue posible actualizar la unidad.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!activeCompany?.id && !isAdminGlobal) {
    return <Navigate to="/seleccionar-empresa" replace state={{ from: `/unidades/${id}/editar` }} />;
  }
  if (!isAdminGlobal && !can('unidades:editar')) {
    return <Navigate to={`/unidades/${id}`} replace />;
  }

  return (
    <WorkspaceLayout activeNav="units">
      <section className="create-record-heading">
        <div className="create-record-title-group">
          <button type="button" className="create-back-button" onClick={() => navigate(`/unidades/${id}`)}><ArrowLeft size={15} /> Volver al detalle</button>
          <h1>Editar unidad {unit?.Uni_no_economico || id}</h1>
          <p className="workspace-subtitle">Actualiza los datos de la unidad y conserva sus documentos relacionados.</p>
        </div>
        {unit && <div className="create-company-chip"><Truck size={17} /> {unit.empresa_nombre || activeCompany?.name || 'Empresa actual'}</div>}
      </section>

      {loading && <div className="workspace-loading">Cargando información de la unidad…</div>}
      {!loading && error && <div className="create-alert is-error" role="alert"><CircleAlert size={18} /><p>{error}</p><button type="button" onClick={() => navigate('/unidades')}><X size={16} /></button></div>}
      {lookupError && <div className="create-alert is-warning" role="alert"><CircleAlert size={18} /><p>{lookupError}</p></div>}
      {success && <div className="create-alert is-success" role="status"><CheckCircle2 size={18} /><p>{success}</p></div>}

      {!loading && unit && form && (
        <form className="create-record-form" onSubmit={handleSubmit}>
          <SectionTitle icon={Truck} title="Datos de la unidad" subtitle="Los campos marcados son obligatorios. Serie, motor, ViaPass y valor de factura son opcionales." />
          {loadingLookups && <div className="create-inline-status">Consultando catálogos…</div>}
          <div className="create-form-grid">
            <Field label="No. económico" required><TextInput value={form.noEconomico} onChange={update('noEconomico')} required maxLength={15} /></Field>
            <Field label="Estatus" required><SelectInput value={form.status} onChange={update('status')} required options={[{ value: 'ALTA', label: 'Alta' }, { value: 'BAJA', label: 'Baja' }]} /></Field>
            <Field label="Tipo de unidad" required><SelectInput value={form.tipoId} onChange={update('tipoId')} required options={lookups.types} /></Field>
            <Field label="Estado de unidad" required><SelectInput value={form.estadoId} onChange={update('estadoId')} required options={lookups.states} /></Field>
            <Field label="Combustible" required><SelectInput value={form.combustibleId} onChange={update('combustibleId')} required options={lookups.fuels} /></Field>
            <Field label="Año modelo" required><TextInput type="number" value={form.anioModelo} onChange={update('anioModelo')} required min="1980" max={new Date().getFullYear() + 1} /></Field>
            <Field label="Marca" required><TextInput value={form.marca} onChange={update('marca')} required maxLength={25} /></Field>
            <Field label="Modelo" required><TextInput value={form.modelo} onChange={update('modelo')} required maxLength={25} /></Field>
            <Field label="Número de serie (VIN)"><TextInput value={form.noSerie} onChange={update('noSerie')} maxLength={25} /></Field>
            <Field label="Número de motor"><TextInput value={form.noMotor} onChange={update('noMotor')} maxLength={20} /></Field>
            <Field label="Ejes"><TextInput type="number" value={form.ejes} onChange={update('ejes')} min="1" /></Field>
            <Field label="Llantas" required><TextInput type="number" value={form.llantas} onChange={update('llantas')} required min="1" /></Field>
            <Field label="ViaPass"><TextInput value={form.viapass} onChange={update('viapass')} maxLength={15} /></Field>
            <Field label="Fecha de alta SCT" required><TextInput type="date" value={form.fechaAltaSCT} onChange={update('fechaAltaSCT')} required /></Field>
            <Field label="Valor factura"><TextInput type="number" value={form.valorFactura} onChange={update('valorFactura')} min="0" step="0.01" /></Field>
          </div>

          <SectionTitle icon={ClipboardList} title="Verificaciones" subtitle="Se conserva un solo registro vigente, sin historial." />
          <div className="create-form-grid">
            <Field label="Fecha verificación mecánica" required><TextInput type="date" value={form.fechaVerificacionMecanica} onChange={update('fechaVerificacionMecanica')} required /></Field>
            <Field label="Costo verificación mecánica" required><TextInput type="number" value={form.costoVerificacionMecanica} onChange={update('costoVerificacionMecanica')} required min="0" step="0.01" /></Field>
            <Field label="Periodo verificación mecánica" required><SelectInput value={form.periodoVerificacionMecanicaId} onChange={update('periodoVerificacionMecanicaId')} required options={lookups.periods} /></Field>
            <ExistingFile label="Constancia verificación mecánica" url={unit.Uni_url_verificacion_mecanica} file={files.mechanical} onChange={setFile('mechanical')} />
            <Field label="Fecha verificación contaminantes" required><TextInput type="date" value={form.fechaVerificacionContaminantes} onChange={update('fechaVerificacionContaminantes')} required /></Field>
            <Field label="Costo verificación contaminantes" required><TextInput type="number" value={form.costoVerificacionContaminantes} onChange={update('costoVerificacionContaminantes')} required min="0" step="0.01" /></Field>
            <Field label="Periodo verificación contaminantes" required><SelectInput value={form.periodoVerificacionContaminantesId} onChange={update('periodoVerificacionContaminantesId')} required options={lookups.periods} /></Field>
            <ExistingFile label="Constancia verificación contaminantes" url={unit.Uni_url_verificacion_contaminantes} file={files.contaminants} onChange={setFile('contaminants')} />
            <ExistingFile label="Factura de la unidad" url={unit.Uni_factura_url} file={files.invoice} onChange={setFile('invoice')} />
          </div>

          <div className="create-alert is-warning" role="note">
            <CircleAlert size={18} />
            <p>La empresa actual y el propietario no se editan desde aquí. El cambio de empresa o propietario es una operación administrativa independiente.</p>
          </div>
          <div className="create-form-actions">
            <button type="button" className="workspace-secondary-button" onClick={() => navigate(`/unidades/${id}`)} disabled={submitting}>Cancelar</button>
            <button type="submit" className="workspace-primary-button" disabled={submitting || loadingLookups}>
              {submitting ? <><span className="create-spinner" /> Guardando…</> : <><Save size={16} /> Guardar cambios</>}
            </button>
          </div>
        </form>
      )}
    </WorkspaceLayout>
  );
}
