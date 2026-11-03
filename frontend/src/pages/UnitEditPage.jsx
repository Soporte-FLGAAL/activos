import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BadgeCheck, CheckCircle2, CircleAlert, ClipboardList, FileText, Save, ShieldCheck, Truck, X } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';
import { deleteUploadedDocument, listRecords, uploadDocument } from '../services/creationApi';
import { apiRequest } from '../services/apiClient';
import ProtectedDocumentLink from '../components/ProtectedDocumentLink';
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
  return (
    <Field
      label={`Reemplazar ${label.toLowerCase()}`}
      hint={file?.name || (url
        ? 'Selecciona otro archivo para reemplazarlo; si no seleccionas uno, se conserva el actual.'
        : 'No hay documento actual. Selecciona un archivo para adjuntarlo.')}
    >
      <div className="unit-file-input-control">
        {url
          ? <ProtectedDocumentLink href={url}>Ver documento actual</ProtectedDocumentLink>
          : <span className="unit-file-no-document">Sin documento actual</span>}
        <input
          className="create-file-input"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={(event) => onChange(event.target.files?.[0] || null)}
        />
      </div>
    </Field>
  );
}

function absoluteFileUrl(uploaded) {
  return uploaded?.url || null;
}

function RelatedRecordEditor({ record, title, fields, canEdit, onSave, companyId }) {
  const initialValues = () => Object.fromEntries(fields.filter((field) => field.type !== 'file').map((field) => [
    field.key,
    field.type === 'date' ? todayValue(record?.[field.source]) : (record?.[field.source] == null ? '' : String(record[field.source])),
  ]));
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(initialValues);
  const [files, setFiles] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {};
    const uploadedFiles = [];
    const replacedDocumentUrls = [];

    fields.filter((field) => field.type !== 'file').forEach((field) => {
      const value = values[field.key] ?? '';
      if (field.serialize === 'number') payload[field.key] = value === '' ? null : Number(value);
      else if (field.serialize === 'nullable') payload[field.key] = String(value).trim() || null;
      else if (field.type === 'date' && field.nullable) payload[field.key] = value || null;
      else payload[field.key] = value;
    });

    try {
      for (const field of fields.filter((item) => item.type === 'file')) {
        const selectedFile = files[field.key];
        if (!selectedFile) continue;

        const uploaded = await uploadDocument(selectedFile, field.uploadType, companyId, {
          metadata: field.metadata || {},
        });
        uploadedFiles.push(uploaded);
        payload[field.key] = absoluteFileUrl(uploaded);

        const previousUrl = record?.[field.source];
        if (previousUrl && previousUrl !== uploaded.url) replacedDocumentUrls.push(previousUrl);
      }

      await onSave(payload);
      setEditing(false);
      setFiles({});

      // The server removes an old file only when no other record references it.
      await Promise.allSettled(
        replacedDocumentUrls.map((url) => deleteUploadedDocument(url, companyId))
      );
    } catch (requestError) {
      // A failed save must not leave newly uploaded, unreferenced files behind.
      await Promise.allSettled(
        uploadedFiles.map((uploaded) => deleteUploadedDocument(uploaded.url, companyId))
      );
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
            {fields.map((field) => <Field
              key={field.key}
              label={field.type === 'file' ? 'Documento' : field.label}
              required={field.required}
              hint={field.type === 'file'
                ? (files[field.key]?.name || (record?.[field.source]
                  ? 'El documento actual se conserva si no seleccionas otro archivo.'
                  : 'No hay documento actual; selecciona uno para adjuntarlo.'))
                : undefined}
            >
              {field.type === 'file'
                ? <div className="unit-file-input-control">
                    {record?.[field.source]
                      ? <ProtectedDocumentLink href={record[field.source]}>Ver documento actual</ProtectedDocumentLink>
                      : <span className="unit-file-no-document">Sin documento actual</span>}
                    <input className="create-file-input" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => setFiles((current) => ({ ...current, [field.key]: event.target.files?.[0] || null }))} />
                  </div>
                : field.options
                  ? <SelectInput value={values[field.key]} onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))} options={values[field.key] && !field.options.some((option) => String(option.value) === String(values[field.key])) ? [{ value: String(values[field.key]), label: `Actual (${values[field.key]})` }, ...field.options] : field.options} required={field.required} />
                  : <TextInput type={field.type || 'text'} value={values[field.key]} onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))} required={field.required} min={field.min} max={field.max} maxLength={field.maxLength} step={field.step} />}
            </Field>)}
          </div>
          {error && <div className="create-alert is-error" role="alert"><CircleAlert size={16} /><p>{error}</p></div>}
          <div className="create-form-actions unit-related-actions">
            <button type="button" className="workspace-secondary-button" onClick={() => { setValues(initialValues()); setFiles({}); setEditing(false); setError(''); }} disabled={saving}>Cancelar</button>
            <button type="submit" className="workspace-primary-button" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
          </div>
        </form>
      ) : (
        <dl className="unit-related-summary">
          {fields.map((field) => <div key={field.key}><dt>{field.label}</dt><dd>{field.type === 'file'
                  ? (record?.[field.source] ? <ProtectedDocumentLink href={record[field.source]}>Ver documento actual</ProtectedDocumentLink> : 'Sin documento')
                  : record?.[field.source] == null || record?.[field.source] === '' ? '—' : (field.type === 'date' ? todayValue(record[field.source]) : String(record[field.source]))}</dd></div>)}
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
        setLookups((current) => ({
          ...current,
          types: types.items.map((row) => ({ value: String(row.TpU_id), label: row.TpU_nombre })),
          states: states.items.map((row) => ({ value: String(row.EsU_id), label: row.EsU_estado })),
          fuels: fuels.items.map((row) => ({ value: String(row.Com_id), label: row.Com_nombre })),
          periods: periods.items.map((row) => ({ value: String(row.Per_id), label: row.Per_nombre })),
        }));

        const optionalLookups = await Promise.allSettled([
          listRecords('/catalogos/tipo-movimiento-placa', {}, { ...companyOptions, signal: controller.signal }),
          listRecords('/catalogos/tipo-tarjeta', {}, { ...companyOptions, signal: controller.signal }),
          listRecords('/catalogos/tipo-poliza', {}, { ...companyOptions, signal: controller.signal }),
          listRecords('/aseguradoras', {}, { ...companyOptions, signal: controller.signal }),
        ]);
        if (cancelled) return;
        setLookups((current) => ({
          ...current,
          movementTypes: optionalLookups[0].status === 'fulfilled' ? optionalLookups[0].value.items.map((row) => ({ value: String(row.TpMP_id), label: row.TpMP_nombre })) : [],
          cardTypes: optionalLookups[1].status === 'fulfilled' ? optionalLookups[1].value.items.map((row) => ({ value: String(row.TpT_id), label: row.TpT_nombre })) : [],
          policyTypes: optionalLookups[2].status === 'fulfilled' ? optionalLookups[2].value.items.map((row) => ({ value: String(row.TpP_id), label: row.TpP_nombre })) : [],
          insurers: optionalLookups[3].status === 'fulfilled' ? optionalLookups[3].value.items.map((row) => ({ value: String(row.Ase_id), label: row.Ase_nombre })) : [],
        }));
      } catch (requestError) {
        if (!cancelled && requestError.name !== 'AbortError') setLookupError(requestError.message || 'No fue posible cargar los catálogos.');
      } finally {
        if (!cancelled) setLoadingLookups(false);
      }
    }
    loadLookups();
    return () => { cancelled = true; controller.abort(); };
  }, [companyOptions]);

  useEffect(() => {
    if (!activeCompany?.id && !isAdminGlobal) return undefined;
    const controller = new AbortController();
    let cancelled = false;

    async function loadRelatedRecords() {
      setLoadingRelated(true);
      setRelatedError('');
      const warnings = [];
      const getRows = async (endpoint, filters, permission) => {
        if (!isAdminGlobal && !can(permission)) return [];
        try {
          const result = await listRecords(endpoint, { limit: 200, ...filters }, { signal: controller.signal });
          return result.items;
        } catch (requestError) {
          if (requestError.name !== 'AbortError') warnings.push(`${endpoint}: ${requestError.message}`);
          return [];
        }
      };

      try {
        const [cards, policies, doublePermits, sictPermits] = await Promise.all([
          getRows('/tarjetas', { unidadId: id }, 'tarjetas:ver'),
          getRows('/polizas', { unidadId: id }, 'polizas:ver'),
          getRows('/doble-articulado', { unidadId: id }, 'permisos_especiales:ver'),
          getRows('/sict', { unidadId: id }, 'sict:ver'),
        ]);
        if (cancelled) return;

        const plateIds = [...new Set(cards.map((row) => Number(row.TC_placas_id)).filter((value) => Number.isSafeInteger(value) && value > 0))];
        let plates = [];
        let movements = [];
        if (plateIds.length && (isAdminGlobal || can('placas:ver'))) {
          const allPlates = await getRows('/placas', {}, 'placas:ver');
          plates = allPlates.filter((plate) => plateIds.includes(Number(plate.Pla_id)));
          if (isAdminGlobal || can('detalle_placas:ver')) {
            const movementGroups = await Promise.all(plates.map(async (plate) => getRows('/detalle-placas', { placasId: plate.Pla_id }, 'detalle_placas:ver')));
            movements = movementGroups.flat();
          }
        }

        const policiesWithEndosos = await Promise.all(policies.map(async (policy) => {
          if (!isAdminGlobal && !can('endosos:ver')) return { ...policy, endosos: [] };
          const endosos = await getRows('/endosos', { polizaId: policy.Pol_id }, 'endosos:ver');
          const endososWithIncisos = await Promise.all(endosos.map(async (endorsement) => {
            if (!isAdminGlobal && !can('incisos:ver')) return { ...endorsement, incisos: [] };
            const incisos = await getRows('/incisos', { endosoId: endorsement.End_id }, 'incisos:ver');
            return { ...endorsement, incisos };
          }));
          return { ...policy, endosos: endososWithIncisos };
        }));

        if (!cancelled) {
          setRelated({ plates, movements, cards, policies: policiesWithEndosos, doublePermits, sictPermits });
          if (warnings.length) setRelatedError(`Algunos registros relacionados no se pudieron consultar: ${warnings.join(' · ')}`);
        }
      } catch (requestError) {
        if (!cancelled && requestError.name !== 'AbortError') setRelatedError(requestError.message || 'No fue posible consultar los registros relacionados.');
      } finally {
        if (!cancelled) setLoadingRelated(false);
      }
    }

    loadRelatedRecords();
    return () => { cancelled = true; controller.abort(); };
  }, [id, activeCompany?.id, isAdminGlobal, can, relatedRefresh]);

  async function saveRelatedRecord(endpoint, recordId, payload) {
    await apiRequest(`${endpoint}/${encodeURIComponent(recordId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    setRelatedRefresh((current) => current + 1);
    setSuccess('Registro relacionado actualizado correctamente.');
  }

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

    const companyId = activeCompany?.id ?? unit?.Uni_empresa_actual;
    const uploadedFiles = [];
    const replacedDocumentUrls = [];

    try {
      const noEconomico = form.noEconomico.trim();

      // Sequential uploads let us clean every file successfully uploaded before a later failure.
      const invoice = files.invoice
        ? await uploadReplacement(files.invoice, 'factura', { identificador: noEconomico })
        : null;
      if (invoice) {
        uploadedFiles.push(invoice);
        if (unit.Uni_factura_url) replacedDocumentUrls.push(unit.Uni_factura_url);
      }

      const mechanical = files.mechanical
        ? await uploadReplacement(files.mechanical, 'verificacion_mecanica', { noEconomico, verificacionTipo: 'mecanica' })
        : null;
      if (mechanical) {
        uploadedFiles.push(mechanical);
        if (unit.Uni_url_verificacion_mecanica) replacedDocumentUrls.push(unit.Uni_url_verificacion_mecanica);
      }

      const contaminants = files.contaminants
        ? await uploadReplacement(files.contaminants, 'verificacion_contaminantes', { noEconomico, verificacionTipo: 'contaminantes' })
        : null;
      if (contaminants) {
        uploadedFiles.push(contaminants);
        if (unit.Uni_url_verificacion_contaminantes) replacedDocumentUrls.push(unit.Uni_url_verificacion_contaminantes);
      }

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

      // A shared file remains untouched while any unit, card, policy or permit refers to it.
      await Promise.allSettled(
        replacedDocumentUrls.map((url) => deleteUploadedDocument(url, companyId))
      );
    } catch (requestError) {
      // Remove only the uploads from this failed operation; the server checks references first.
      await Promise.allSettled(
        uploadedFiles.map((uploaded) => deleteUploadedDocument(uploaded.url, companyId))
      );
      setError(requestError.message || 'No fue posible actualizar la unidad.');
    } finally {
      setSubmitting(false);
    }
  }

  const hasReadPermission = (permission) => isAdminGlobal || can(permission);
  const editorFor = (record, endpoint, recordId, title, fields, permission, forceGlobal = false) => (
    <RelatedRecordEditor
      key={`${endpoint}-${recordId}-${relatedRefresh}`}
      record={record}
      title={title}
      fields={fields}
      canEdit={forceGlobal ? isAdminGlobal : hasReadPermission(permission)}
      companyId={activeCompany?.id ?? unit?.Uni_empresa_actual}
      onSave={(payload) => saveRelatedRecord(endpoint, recordId, payload)}
    />
  );

  const plateOptions = related.plates.map((plate) => ({ value: String(plate.Pla_id), label: plate.Pla_placas || `Placa ${plate.Pla_id}` }));

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

      <nav className="create-record-tabs unit-edit-tabs" aria-label="Secciones de edición">
        {EDIT_TABS.map(({ id: tabId, label, icon: Icon }) => <button key={tabId} type="button" className={activeEditTab === tabId ? 'is-active' : ''} onClick={() => setActiveEditTab(tabId)}><Icon size={17} /><span>{label}</span></button>)}
      </nav>
      {relatedError && <div className="create-alert is-warning" role="alert"><CircleAlert size={18} /><p>{relatedError}</p></div>}
      {loadingRelated && activeEditTab !== 'unidad' && <div className="create-inline-status">Consultando registros relacionados…</div>}

      {!loading && unit && form && activeEditTab === 'unidad' && (
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

      {!loadingRelated && activeEditTab === 'placas' && <section className="create-record-form">
        <SectionTitle icon={BadgeCheck} title="Placas relacionadas" subtitle="Se muestran las placas vinculadas mediante las tarjetas de circulación de esta unidad." />
        {!hasReadPermission('placas:ver') ? <p className="registry-muted-note">Tu rol no tiene permiso para consultar placas.</p> : related.plates.length === 0 ? <p className="registry-muted-note">No hay placas relacionadas con esta unidad.</p> : related.plates.map((plate) => editorFor(plate, '/placas', plate.Pla_id, `Placa ${plate.Pla_placas || plate.Pla_id}`, [
          { key: 'placas', source: 'Pla_placas', label: 'Número de placas', required: true, maxLength: 10 },
          { key: 'status', source: 'Pla_status', label: 'Estatus', required: true, maxLength: 20 },
        ], 'placas:editar'))}

        <SectionTitle icon={ClipboardList} title="Movimientos de placas" subtitle="Actualiza el costo, la fecha y el tipo de movimiento de cada registro existente." />
        {!hasReadPermission('detalle_placas:ver') ? <p className="registry-muted-note">Tu rol no tiene permiso para consultar movimientos de placas.</p> : related.movements.length === 0 ? <p className="registry-muted-note">No hay movimientos registrados para las placas vinculadas.</p> : related.movements.map((movement) => editorFor(movement, '/detalle-placas', movement.DP_id, `Movimiento · ${movement.Pla_placas || movement.DP_id}`, [
          { key: 'tipoMovimientoId', source: 'DP_tipo_movimiento', label: 'Tipo de movimiento', type: 'select', options: lookups.movementTypes, required: true, serialize: 'number' },
          { key: 'costo', source: 'DP_costo', label: 'Costo', type: 'number', required: true, min: 0, step: '0.01', serialize: 'number' },
          { key: 'fecha', source: 'DP_fecha', label: 'Fecha', type: 'date', required: true },
          { key: 'url', source: 'DP_url', label: 'Comprobante del movimiento', type: 'file', uploadType: 'detalle_placa' },
        ], 'detalle_placas:editar'))}
      </section>}

      {!loadingRelated && activeEditTab === 'tarjetas' && <section className="create-record-form">
        <SectionTitle icon={ClipboardList} title="Tarjetas de circulación" subtitle="Edita las tarjetas ya asociadas a esta unidad; no se crean tarjetas nuevas desde esta pantalla." />
        {!hasReadPermission('tarjetas:ver') ? <p className="registry-muted-note">Tu rol no tiene permiso para consultar tarjetas de circulación.</p> : related.cards.length === 0 ? <p className="registry-muted-note">No hay tarjetas de circulación relacionadas con esta unidad.</p> : <>
          {!isAdminGlobal && <div className="create-alert is-warning"><CircleAlert size={18} /><p>La edición de tarjetas de circulación está reservada a ADMIN_GLOBAL en el backend.</p></div>}
          {related.cards.map((card) => editorFor(card, '/tarjetas', card.TC_id, `Tarjeta ${card.TC_tarjeta || card.TC_id}`, [
            { key: 'tarjeta', source: 'TC_tarjeta', label: 'Número de tarjeta', required: true, maxLength: 50 },
            { key: 'costo', source: 'TC_costo', label: 'Costo', type: 'number', min: 0, step: '0.01', required: true, serialize: 'number' },
            { key: 'tipoId', source: 'TC_tipo', label: 'Tipo de tarjeta', type: 'select', options: lookups.cardTypes, required: true, serialize: 'number' },
            { key: 'status', source: 'TC_status', label: 'Estatus', required: true, maxLength: 20 },
            { key: 'noOriginal', source: 'TC_no_original', label: 'Número original', nullable: true, serialize: 'nullable', maxLength: 50 },
            { key: 'placasId', source: 'TC_placas_id', label: 'Placas', type: 'select', options: plateOptions, required: true, serialize: 'number' },
            { key: 'fechaObtencion', source: 'TC_fecha_obtencion', label: 'Fecha de obtención', type: 'date', required: true },
            { key: 'fechaVencimiento', source: 'TC_fecha_vencimiento', label: 'Fecha de vencimiento', type: 'date', nullable: true },
            { key: 'fechaReposicion', source: 'TC_fecha_reposicion', label: 'Fecha de reposición', type: 'date', nullable: true },
            { key: 'costoReposicion', source: 'TC_costo_reposicion', label: 'Costo de reposición', type: 'number', min: 0, step: '0.01', serialize: 'number' },
            { key: 'url', source: 'TC_url', label: 'Documento de tarjeta', type: 'file', uploadType: 'tarjeta' },
            { key: 'urlReposicion', source: 'TC_url_reposicion', label: 'Documento de reposición', type: 'file', uploadType: 'tarjeta_reposicion' },
          ], 'tarjetas:editar', true))}
        </>}
      </section>}

      {!loadingRelated && activeEditTab === 'polizas' && <section className="create-record-form">
        <SectionTitle icon={FileText} title="Pólizas, endosos e incisos" subtitle="Los documentos se editan sobre sus registros actuales, conservando sus relaciones con la unidad." />
        {!hasReadPermission('polizas:ver') ? <p className="registry-muted-note">Tu rol no tiene permiso para consultar pólizas.</p> : related.policies.length === 0 ? <p className="registry-muted-note">No hay pólizas relacionadas con esta unidad.</p> : related.policies.map((policy) => (
          <div className="unit-related-group" key={`policy-${policy.Pol_id}`}>
            {editorFor(policy, '/polizas', policy.Pol_id, `Póliza ${policy.Pol_poliza || policy.Pol_id}`, [
              { key: 'poliza', source: 'Pol_poliza', label: 'Número de póliza', required: true, maxLength: 15 },
              { key: 'aseguradoraId', source: 'Pol_aseguradora', label: 'Aseguradora', type: 'select', options: lookups.insurers, required: true, serialize: 'number' },
              { key: 'tipoPolizaId', source: 'Pol_tipo_poliza', label: 'Tipo de póliza', type: 'select', options: lookups.policyTypes, required: true, serialize: 'number' },
              { key: 'fechaInicio', source: 'Pol_fecha_inicio', label: 'Fecha de inicio', type: 'date', required: true },
              { key: 'fechaFin', source: 'Pol_fecha_fin', label: 'Fecha de fin', type: 'date', required: true },
              { key: 'costo', source: 'Pol_costo', label: 'Costo', type: 'number', min: 0, step: '0.01', required: true, serialize: 'number' },
              { key: 'url', source: 'Pol_url', label: 'Documento de póliza', type: 'file', uploadType: 'poliza' },
            ], 'polizas:editar')}
            {!hasReadPermission('endosos:ver') ? <p className="registry-muted-note">No tienes permiso para consultar endosos.</p> : (policy.endosos || []).map((endorsement) => (
              <div className="unit-related-nested" key={`endorsement-${endorsement.End_id}`}>
                {editorFor(endorsement, '/endosos', endorsement.End_id, `Endoso ${endorsement.End_endoso}`, [
                  { key: 'endoso', source: 'End_endoso', label: 'Número de endoso', required: true, maxLength: 6 },
                  { key: 'url', source: 'End_url', label: 'Documento del endoso', type: 'file', uploadType: 'endoso' },
                ], 'endosos:editar')}
                {!hasReadPermission('incisos:ver') ? <p className="registry-muted-note">No tienes permiso para consultar incisos.</p> : (endorsement.incisos || []).map((inciso) => editorFor(inciso, '/incisos', inciso.Inc_id, `Inciso ${inciso.Inc_inciso}`, [
                  { key: 'inciso', source: 'Inc_inciso', label: 'Número de inciso', required: true, maxLength: 6 },
                  { key: 'url', source: 'Inc_url', label: 'Documento del inciso', type: 'file', uploadType: 'inciso' },
                ], 'incisos:editar'))}
              </div>
            ))}
          </div>
        ))}
      </section>}

      {!loadingRelated && activeEditTab === 'doble' && <section className="create-record-form">
        <SectionTitle icon={Truck} title="Permisos de doble articulado" subtitle="Edita los permisos existentes asociados a esta unidad." />
        {!hasReadPermission('permisos_especiales:ver') ? <p className="registry-muted-note">Tu rol no tiene permiso para consultar permisos especiales.</p> : related.doublePermits.length === 0 ? <p className="registry-muted-note">No hay permisos de doble articulado asociados.</p> : related.doublePermits.map((permit) => editorFor(permit, '/doble-articulado', permit.PDA_id, `Permiso ${permit.PDA_permiso}`, [
          { key: 'permiso', source: 'PDA_permiso', label: 'Número de permiso', required: true, maxLength: 30 },
          { key: 'fechaObtencion', source: 'PDA_fecha_obtencion', label: 'Fecha de obtención', type: 'date', required: true },
          { key: 'fechaVencimiento', source: 'PDA_fecha_vencimiento', label: 'Fecha de vencimiento', type: 'date', required: true },
          { key: 'url', source: 'PDA_url', label: 'Documento del permiso', type: 'file', uploadType: 'doble_articulado' },
        ], 'permisos_especiales:editar'))}
      </section>}

      {!loadingRelated && activeEditTab === 'sict' && <section className="create-record-form">
        <SectionTitle icon={ShieldCheck} title="Permisos SICT" subtitle="Edita los permisos SICT existentes asociados a esta unidad." />
        {!hasReadPermission('sict:ver') ? <p className="registry-muted-note">Tu rol no tiene permiso para consultar permisos SICT.</p> : related.sictPermits.length === 0 ? <p className="registry-muted-note">No hay permisos SICT asociados.</p> : related.sictPermits.map((permit) => editorFor(permit, '/sict', permit.SICT_id, `Permiso ${permit.SICT_permiso}`, [
          { key: 'permiso', source: 'SICT_permiso', label: 'Número de permiso', required: true, maxLength: 30 },
          { key: 'fechaObtencion', source: 'SICT_fecha_obtencion', label: 'Fecha de obtención', type: 'date', required: true },
          { key: 'fechaVencimiento', source: 'SICT_fecha_vencimiento', label: 'Fecha de vencimiento', type: 'date', required: true },
          { key: 'url', source: 'SICT_url', label: 'Documento SICT', type: 'file', uploadType: 'sict' },
        ], 'sict:editar'))}
      </section>}
    </WorkspaceLayout>
  );
}
