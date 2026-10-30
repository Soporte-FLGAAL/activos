import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BadgeCheck, Building2, CheckCircle2, CircleAlert, ClipboardList, FileUp, Plus, ShieldAlert, ShieldCheck, Truck, X } from 'lucide-react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';
import { listRecords, uploadDocument, createUnit, createPlate, createPlateDetail, createDoubleArticulatedPermit, createSictPermit, createCirculationCard, createPolicy } from '../services/creationApi';
import '../styles/create-record.css';

function localToday() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}
const today = localToday();
const blankUnit = () => ({
  noEconomico: '', status: 'ALTA', tipoId: '', estadoId: '', combustibleId: '', noSerie: '', noMotor: '',
  anioModelo: String(new Date().getFullYear()), modelo: '', marca: '', ejes: '', llantas: '4', viapass: '',
  propietarioId: '', fechaAltaSCT: today, valorFactura: '0',
  fechaVerificacionMecanica: today, costoVerificacionMecanica: '0', periodoVerificacionMecanicaId: '',
  fechaVerificacionContaminantes: today, costoVerificacionContaminantes: '0', periodoVerificacionContaminantesId: '',
});
const blankPlate = () => ({ placas: '', status: 'ACTIVA', propietarioId: '', empresaActualId: '' });
const blankPlateMovement = () => ({ tipoMovimientoId: '', costo: '0', fecha: today });
const blankSpecialPermit = () => ({ permiso: '', unidadId: '', fechaObtencion: today, fechaVencimiento: '' });
const blankCard = () => ({ tarjeta: '', unidadId: '', costo: '0', tipoId: '', status: 'VIGENTE', noOriginal: '', placasId: '', fechaObtencion: today, fechaVencimiento: '', fechaReposicion: '', costoReposicion: '', });
const blankPolicy = () => ({ poliza: '', unidadId: '', aseguradoraId: '', tipoPolizaId: '', fechaInicio: today, fechaFin: '', costo: '0' });

function fileUrl(uploaded) { return uploaded?.url || null; }
function unitLabel(row) { return `${row?.Uni_no_economico || `Unidad ${row?.Uni_id}`} · ${row?.Uni_marca || ''} ${row?.Uni_modelo || ''}`.trim(); }
function companyLabel(row) { return row?.name || row?.Emp_nombre || row?.nombre || `Empresa ${row?.id ?? row?.Emp_id}`; }

function Field({ label, children, required = false, hint, wide = false }) {
  return <label className={`create-field${wide ? ' is-wide' : ''}`}><span>{label}{required && <b aria-hidden="true"> *</b>}</span>{children}{hint && <small>{hint}</small>}</label>;
}
function TextInput({ value, onChange, type = 'text', required = false, min, max, step, maxLength, placeholder, accept, disabled = false }) {
  return <input value={value ?? ''} onChange={(event) => onChange(event.target.value)} type={type} required={required} min={min} max={max} step={step} maxLength={maxLength} placeholder={placeholder} accept={accept} disabled={disabled} />;
}
function SelectInput({ value, onChange, options, required = false, placeholder = 'Selecciona una opción', disabled = false }) {
  return <select value={value ?? ''} onChange={(event) => onChange(event.target.value)} required={required} disabled={disabled}><option value="">{placeholder}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
}
function SectionTitle({ icon: Icon = ClipboardList, title, subtitle }) {
  return <div className="create-section-title"><span><Icon size={18} /></span><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div></div>;
}
function FileField({ label, file, onChange, required = false, hint }) {
  return <Field label={label} required={required} hint={hint}><input className="create-file-input" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required={required} onChange={(event) => onChange(event.target.files?.[0] || null)} />{file && <small className="create-file-selected"><FileUp size={13} /> {file.name}</small>}</Field>;
}

export default function CreateRecordPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeCompany, companies, isAdminGlobal } = useAuth();
  const tabs = useMemo(() => [
    { id: 'unidad', label: 'Unidad', icon: Truck },
    { id: 'placa', label: 'Placas', icon: BadgeCheck },
    { id: 'doble-articulado', label: 'Doble articulado', icon: Truck },
    { id: 'sict', label: 'SICT', icon: ShieldCheck },
    { id: 'tarjeta', label: 'Tarjeta de circulación', icon: ClipboardList },
    { id: 'poliza', label: 'Póliza', icon: FileUp },
  ], []);
  const [activeTab, setActiveTab] = useState(tabs.some((tab) => tab.id === searchParams.get('tipo')) ? searchParams.get('tipo') : 'unidad');
  const [targetCompanyId, setTargetCompanyId] = useState(() => String(activeCompany?.id ?? ''));
  const [unitForm, setUnitForm] = useState(blankUnit);
  const [plateForm, setPlateForm] = useState(() => ({ ...blankPlate(), empresaActualId: String(activeCompany?.id ?? '') }));
  const [plateMovementForm, setPlateMovementForm] = useState(blankPlateMovement);
  const [includePlateMovement, setIncludePlateMovement] = useState(true);
  const [doubleArticulatedForm, setDoubleArticulatedForm] = useState(blankSpecialPermit);
  const [sictForm, setSictForm] = useState(blankSpecialPermit);
  const [cardForm, setCardForm] = useState(() => ({ ...blankCard(), unidadId: searchParams.get('unidadId') || '' }));
  const [policyForm, setPolicyForm] = useState(() => ({ ...blankPolicy(), unidadId: searchParams.get('unidadId') || '' }));
  const [unitFiles, setUnitFiles] = useState({ factura: null, mecanica: null, contaminantes: null });
  const [plateMoveFile, setPlateMoveFile] = useState(null);
  const [doubleArticulatedFile, setDoubleArticulatedFile] = useState(null);
  const [sictFile, setSictFile] = useState(null);
  const [cardFile, setCardFile] = useState(null);
  const [cardReplacementFile, setCardReplacementFile] = useState(null);
  const [policyFile, setPolicyFile] = useState(null);
  const [endorsementFile, setEndorsementFile] = useState(null);
  const [incisoFile, setIncisoFile] = useState(null);
  const [samePolicyAndEndorsement, setSamePolicyAndEndorsement] = useState(true);
  const [sameEndorsementAndInciso, setSameEndorsementAndInciso] = useState(true);
  const [createInitialEndorsement, setCreateInitialEndorsement] = useState(true);
  const [endorsementNumber, setEndorsementNumber] = useState('000000');
  const [incisoNumber, setIncisoNumber] = useState('000000');
  const [lookups, setLookups] = useState({ types: [], states: [], fuels: [], periods: [], movementTypes: [], cardTypes: [], policyTypes: [], insurers: [], units: [], plates: [] });
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [lastCreatedUnit, setLastCreatedUnit] = useState(null);

  const updateUnit = (key) => (value) => setUnitForm((current) => ({ ...current, [key]: value }));
  const updatePlate = (key) => (value) => setPlateForm((current) => ({ ...current, [key]: value }));
  const updatePlateMovement = (key) => (value) => setPlateMovementForm((current) => ({ ...current, [key]: value }));
  const updateDoubleArticulated = (key) => (value) => setDoubleArticulatedForm((current) => ({ ...current, [key]: value }));
  const updateSict = (key) => (value) => setSictForm((current) => ({ ...current, [key]: value }));
  const updateCard = (key) => (value) => setCardForm((current) => ({ ...current, [key]: value }));
  const updatePolicy = (key) => (value) => setPolicyForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (activeCompany?.id && !targetCompanyId) {
      setTargetCompanyId(String(activeCompany.id));
      setPlateForm((current) => ({ ...current, empresaActualId: String(activeCompany.id) }));
    }
  }, [activeCompany?.id, targetCompanyId]);

  useEffect(() => {
    const selected = tabs.some((tab) => tab.id === searchParams.get('tipo')) ? searchParams.get('tipo') : 'unidad';
    setActiveTab(selected);
    const id = searchParams.get('unidadId');
    if (id) {
      setCardForm((current) => ({ ...current, unidadId: id }));
      setPolicyForm((current) => ({ ...current, unidadId: id }));
    }
  }, [searchParams, tabs]);

  const currentCompanyOptions = useMemo(() => {
    const mapped = (companies || []).filter((company) => company?.id != null).map((company) => ({ value: String(company.id), label: companyLabel(company) }));
    if (activeCompany?.id && !mapped.some((item) => item.value === String(activeCompany.id))) mapped.unshift({ value: String(activeCompany.id), label: companyLabel(activeCompany) });
    return mapped.sort((a, b) => a.label.localeCompare(b.label, 'es-MX'));
  }, [companies, activeCompany]);

  const loadLookups = useCallback(async (signal, tab, companyId) => {
    setLoadingLookups(true);
    setLookupError('');
    const companyOptions = { signal, company: false };
    const scopedOptions = { signal, ...(companyId ? { headers: { 'X-Empresa-Id': String(companyId) } } : {}) };
    try {
      let patch = {};
      if (tab === 'unidad') {
        const [types, states, fuels, periods] = await Promise.all([
          listRecords('/catalogos/tipo-unidad', {}, companyOptions),
          listRecords('/catalogos/estado-unidad', {}, companyOptions),
          listRecords('/catalogos/combustible', {}, companyOptions),
          listRecords('/catalogos/periodos', {}, companyOptions),
        ]);
        patch = {
          types: types.items.map((row) => ({ value: String(row.TpU_id), label: row.TpU_nombre })),
          states: states.items.map((row) => ({ value: String(row.EsU_id), label: row.EsU_estado })),
          fuels: fuels.items.map((row) => ({ value: String(row.Com_id), label: row.Com_nombre })),
          periods: periods.items.map((row) => ({ value: String(row.Per_id), label: row.Per_nombre })),
        };
      } else if (tab === 'placa') {
        const movementTypesResult = await listRecords('/catalogos/tipo-movimiento-placa', {}, companyOptions);
        patch = {
          movementTypes: movementTypesResult.items.map((row) => ({ value: String(row.TpMP_id), label: row.TpMP_nombre })),
        };
      } else if (tab === 'doble-articulado' || tab === 'sict') {
        const unitsResult = await listRecords('/unidades', { ...(isAdminGlobal && companyId ? { empresaId: companyId } : {}), limit: 200 }, scopedOptions);
        patch = { units: unitsResult.items.map((row) => ({ value: String(row.Uni_id), label: unitLabel(row) })) };
      } else if (tab === 'tarjeta') {
        const [unitsResult, platesResult, typesResult] = await Promise.all([
          listRecords('/unidades', { ...(isAdminGlobal && companyId ? { empresaId: companyId } : {}), limit: 200 }, scopedOptions),
          listRecords('/placas', { limit: 200 }, scopedOptions),
          listRecords('/catalogos/tipo-tarjeta', {}, companyOptions),
        ]);
        patch = {
          units: unitsResult.items.map((row) => ({ value: String(row.Uni_id), label: unitLabel(row) })),
          plates: platesResult.items.map((row) => ({ value: String(row.Pla_id), label: `${row.Pla_placas} · ${row.empresa_nombre || ''}`.trim() })),
          cardTypes: typesResult.items.map((row) => ({ value: String(row.TpT_id), label: row.TpT_nombre })),
        };
      } else if (tab === 'poliza') {
        const [unitsResult, insurersResult, typesResult] = await Promise.all([
          listRecords('/unidades', { ...(isAdminGlobal && companyId ? { empresaId: companyId } : {}), limit: 200 }, scopedOptions),
          listRecords('/aseguradoras', {}, companyOptions),
          listRecords('/catalogos/tipo-poliza', {}, companyOptions),
        ]);
        patch = {
          units: unitsResult.items.map((row) => ({ value: String(row.Uni_id), label: unitLabel(row) })),
          insurers: insurersResult.items.map((row) => ({ value: String(row.Ase_id), label: row.Ase_nombre })),
          policyTypes: typesResult.items.map((row) => ({ value: String(row.TpP_id), label: row.TpP_nombre })),
        };
      }
      setLookups((current) => ({ ...current, ...patch }));
    } catch (error) {
      if (error.name !== 'AbortError') setLookupError(error.message || 'No se pudieron cargar las listas necesarias desde el backend.');
    } finally {
      if (!signal?.aborted) setLoadingLookups(false);
    }
  }, [isAdminGlobal]);

  useEffect(() => {
    if (activeTab !== 'unidad' && !targetCompanyId) {
      setLookups((current) => ({ ...current, units: [], plates: [], insurers: [], policyTypes: [], cardTypes: [] }));
      return undefined;
    }
    const controller = new AbortController();
    loadLookups(controller.signal, activeTab, targetCompanyId);
    return () => controller.abort();
  }, [activeTab, targetCompanyId, loadLookups]);

  function changeTab(nextTab) {
    setActiveTab(nextTab);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('tipo', nextTab);
      if (lastCreatedUnit) next.set('unidadId', String(lastCreatedUnit.id));
      return next;
    });
    setPageError('');
    setSuccessMessage('');
  }

  async function uploadIfSelected(file, type, companyId) {
    if (!file) return null;
    return uploadDocument(file, type, companyId);
  }

  async function handleCreateUnit(event) {
    const formElement = event.currentTarget;
    event.preventDefault();
    setPageError(''); setSuccessMessage('');
    if (!targetCompanyId) { setPageError('Selecciona la empresa actual de la unidad.'); return; }
    setSubmitting(true);
    try {
      const [invoice, mechanical, contaminants] = await Promise.all([
        uploadIfSelected(unitFiles.factura, 'factura', targetCompanyId),
        uploadIfSelected(unitFiles.mecanica, 'verificacion_mecanica', targetCompanyId),
        uploadIfSelected(unitFiles.contaminantes, 'verificacion_contaminantes', targetCompanyId),
      ]);
      const payload = {
        noEconomico: unitForm.noEconomico.trim(), status: unitForm.status,
        tipoId: Number(unitForm.tipoId), estadoId: Number(unitForm.estadoId), combustibleId: Number(unitForm.combustibleId),
        noSerie: unitForm.noSerie.trim(), noMotor: unitForm.noMotor.trim(), anioModelo: Number(unitForm.anioModelo),
        modelo: unitForm.modelo.trim(), marca: unitForm.marca.trim(), ejes: unitForm.ejes === '' ? null : Number(unitForm.ejes),
        llantas: Number(unitForm.llantas), viapass: unitForm.viapass.trim(), propietarioId: Number(isAdminGlobal ? (unitForm.propietarioId || targetCompanyId) : activeCompany.id),
        empresaActualId: Number(targetCompanyId), fechaAltaSCT: unitForm.fechaAltaSCT, valorFactura: Number(unitForm.valorFactura),
        facturaUrl: fileUrl(invoice), fechaVerificacionMecanica: unitForm.fechaVerificacionMecanica,
        costoVerificacionMecanica: Number(unitForm.costoVerificacionMecanica), periodoVerificacionMecanicaId: Number(unitForm.periodoVerificacionMecanicaId),
        fechaVerificacionContaminantes: unitForm.fechaVerificacionContaminantes,
        costoVerificacionContaminantes: Number(unitForm.costoVerificacionContaminantes), periodoVerificacionContaminantesId: Number(unitForm.periodoVerificacionContaminantesId),
        urlVerificacionContaminantes: fileUrl(contaminants), urlVerificacionMecanica: fileUrl(mechanical),
      };
      const created = await createUnit(payload, targetCompanyId);
      const id = created?.Uni_id ?? created?.id;
      if (!id) throw new Error('La API no devolvió el identificador de la unidad creada.');
      setLastCreatedUnit({ id: Number(id), label: `Unidad ${payload.noEconomico}` });
      // Vaciar el formulario y los inputs nativos (incluidos los archivos) solo tras guardar correctamente.
      formElement.reset();
      setUnitForm(blankUnit());
      setUnitFiles({ factura: null, mecanica: null, contaminantes: null });
      setCardForm((current) => ({ ...current, unidadId: String(id) }));
      setPolicyForm((current) => ({ ...current, unidadId: String(id) }));
      setSuccessMessage(`Unidad ${payload.noEconomico} creada correctamente. El formulario quedó limpio; puedes registrar ahora placas, tarjeta, póliza o permisos especiales desde las pestañas superiores.`);
      setPageError('');
    } catch (error) {
      setPageError(error.message || 'No fue posible crear la unidad.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreatePlate(event) {
    const formElement = event.currentTarget;
    event.preventDefault(); setPageError(''); setSuccessMessage('');
    if (!targetCompanyId) { setPageError('Selecciona una empresa.'); return; }
    if (includePlateMovement) {
      if (!plateMovementForm.tipoMovimientoId) { setPageError('Selecciona el tipo de movimiento de la placa.'); return; }
      if (!plateMoveFile) { setPageError('Adjunta el comprobante del movimiento de la placa.'); return; }
    }
    setSubmitting(true);
    try {
      // El movimiento necesita una URL absoluta y el backend no ofrece una transacción
      // que cree placa + detalle a la vez; por eso se sube primero el comprobante.
      const movementDocument = includePlateMovement
        ? await uploadIfSelected(plateMoveFile, 'detalle_placa', targetCompanyId)
        : null;
      const payload = {
        placas: plateForm.placas.trim(), status: plateForm.status,
        propietarioId: plateForm.propietarioId ? Number(plateForm.propietarioId) : (isAdminGlobal ? null : Number(activeCompany?.id)),
        empresaActualId: Number(targetCompanyId),
      };
      const result = await createPlate(payload, targetCompanyId);
      const id = result?.Pla_id ?? result?.id;
      if (!id) throw new Error('La API no devolvió el identificador de la placa creada.');
      if (includePlateMovement) {
        await createPlateDetail({
          placasId: Number(id),
          tipoMovimientoId: Number(plateMovementForm.tipoMovimientoId),
          costo: Number(plateMovementForm.costo),
          fecha: plateMovementForm.fecha,
          url: movementDocument.url,
        }, targetCompanyId);
      }
      formElement.reset();
      setCardForm((current) => ({ ...current, placasId: String(id) }));
      setSuccessMessage(`Placa ${payload.placas} creada correctamente${includePlateMovement ? ' con su detalle de movimiento.' : '; quedó preseleccionada para el formulario de tarjeta.'} El formulario quedó limpio.`);
      setPlateForm((current) => ({ ...blankPlate(), empresaActualId: String(targetCompanyId) }));
      setPlateMovementForm(blankPlateMovement());
      setIncludePlateMovement(true);
      setPlateMoveFile(null);
      setLookupError('');
    } catch (error) { setPageError(error.message || 'No fue posible crear la placa o su detalle de movimiento. Revisa si la placa llegó a guardarse antes de volver a enviar.'); }
    finally { setSubmitting(false); }
  }

  async function handleCreateSpecialPermit(event, permitType) {
    const formElement = event.currentTarget;
    event.preventDefault(); setPageError(''); setSuccessMessage('');
    if (!targetCompanyId) { setPageError('Selecciona una empresa.'); return; }
    const isDoubleArticulated = permitType === 'doble-articulado';
    const form = isDoubleArticulated ? doubleArticulatedForm : sictForm;
    const file = isDoubleArticulated ? doubleArticulatedFile : sictFile;
    if (!form.unidadId) { setPageError('Selecciona la unidad asociada al permiso.'); return; }
    if (!file) { setPageError(`Adjunta el documento del permiso ${isDoubleArticulated ? 'de doble articulado' : 'SICT'}.`); return; }
    setSubmitting(true);
    try {
      const uploaded = await uploadIfSelected(file, isDoubleArticulated ? 'doble_articulado' : 'sict', targetCompanyId);
      const payload = {
        permiso: form.permiso.trim(),
        unidadId: Number(form.unidadId),
        fechaObtencion: form.fechaObtencion,
        fechaVencimiento: form.fechaVencimiento,
        url: uploaded.url,
      };
      if (isDoubleArticulated) {
        await createDoubleArticulatedPermit(payload, targetCompanyId);
        formElement.reset();
        setDoubleArticulatedForm(blankSpecialPermit());
        setDoubleArticulatedFile(null);
        setSuccessMessage('Permiso de doble articulado creado correctamente.');
      } else {
        await createSictPermit(payload, targetCompanyId);
        formElement.reset();
        setSictForm(blankSpecialPermit());
        setSictFile(null);
        setSuccessMessage('Permiso SICT creado correctamente.');
      }
    } catch (error) {
      setPageError(error.message || `No fue posible crear el permiso ${isDoubleArticulated ? 'de doble articulado' : 'SICT'}.`);
    } finally { setSubmitting(false); }
  }

  async function handleCreateCard(event) {
    const formElement = event.currentTarget;
    event.preventDefault(); setPageError(''); setSuccessMessage('');
    if (!isAdminGlobal) { setPageError('El backend actual permite crear tarjetas de circulación únicamente a ADMIN_GLOBAL.'); return; }
    if (!targetCompanyId) { setPageError('Selecciona la empresa de la unidad.'); return; }
    setSubmitting(true);
    try {
      const uploaded = await uploadIfSelected(cardFile, 'tarjeta', targetCompanyId);
      if (!uploaded) throw new Error('Adjunta el PDF o imagen de la tarjeta de circulación.');
      let replacement = null;
      if (cardReplacementFile) replacement = await uploadIfSelected(cardReplacementFile, 'tarjeta_reposicion', targetCompanyId);
      const payload = {
        tarjeta: cardForm.tarjeta.trim(), unidadId: Number(cardForm.unidadId), costo: Number(cardForm.costo),
        tipoId: Number(cardForm.tipoId), status: cardForm.status, noOriginal: cardForm.noOriginal.trim() || null,
        placasId: Number(cardForm.placasId), fechaObtencion: cardForm.fechaObtencion,
        fechaVencimiento: cardForm.fechaVencimiento || null, fechaReposicion: cardForm.fechaReposicion || null,
        costoReposicion: cardForm.costoReposicion === '' ? null : Number(cardForm.costoReposicion),
        url: uploaded.url, urlReposicion: fileUrl(replacement),
      };
      await createCirculationCard(payload, targetCompanyId);
      formElement.reset();
      setSuccessMessage('Tarjeta de circulación creada correctamente. El formulario quedó limpio.');
      setCardFile(null); setCardReplacementFile(null); setCardForm((current) => ({ ...blankCard(), unidadId: current.unidadId }));
    } catch (error) { setPageError(error.message || 'No fue posible crear la tarjeta.'); }
    finally { setSubmitting(false); }
  }

  async function handleCreatePolicy(event) {
    const formElement = event.currentTarget;
    event.preventDefault(); setPageError(''); setSuccessMessage('');
    if (!targetCompanyId) { setPageError('Selecciona la empresa de la unidad.'); return; }
    setSubmitting(true);
    try {
      const policyDoc = await uploadIfSelected(policyFile, 'poliza', targetCompanyId);
      if (!policyDoc) throw new Error('Adjunta el documento de la póliza.');
      let endorsementUrl = policyDoc.url;
      let incisoUrl = policyDoc.url;
      if (createInitialEndorsement && !samePolicyAndEndorsement) {
        const uploadedEndorsement = await uploadIfSelected(endorsementFile, 'endoso', targetCompanyId);
        if (!uploadedEndorsement) throw new Error('Adjunta el documento del endoso o activa la casilla para reutilizar el documento de la póliza.');
        endorsementUrl = uploadedEndorsement.url;
      }
      if (createInitialEndorsement) {
        if (sameEndorsementAndInciso) incisoUrl = endorsementUrl;
        else {
          const uploadedInciso = await uploadIfSelected(incisoFile, 'inciso', targetCompanyId);
          if (!uploadedInciso) throw new Error('Adjunta el documento del inciso o activa la casilla para reutilizar el documento del endoso.');
          incisoUrl = uploadedInciso.url;
        }
      }
      const policy = {
        poliza: policyForm.poliza.trim(), aseguradoraId: Number(policyForm.aseguradoraId), unidadId: Number(policyForm.unidadId),
        tipoPolizaId: Number(policyForm.tipoPolizaId), fechaInicio: policyForm.fechaInicio, fechaFin: policyForm.fechaFin,
        costo: Number(policyForm.costo), url: policyDoc.url,
      };
      if (createInitialEndorsement) {
        await createPolicy({ poliza: policy, endosos: [{ endoso: endorsementNumber.trim() || '000000', url: endorsementUrl, incisos: [{ inciso: incisoNumber.trim() || '000000', url: incisoUrl }] }] }, targetCompanyId, true);
      } else {
        await createPolicy(policy, targetCompanyId, false);
      }
      formElement.reset();
      setSuccessMessage(createInitialEndorsement ? `Póliza creada con endoso ${endorsementNumber || '000000'} e inciso ${incisoNumber || '000000'}. Los documentos compartidos se subieron una sola vez. El formulario quedó limpio.` : 'Póliza creada correctamente. El formulario quedó limpio.');
      setPolicyFile(null); setEndorsementFile(null); setIncisoFile(null);
      setPolicyForm((current) => ({ ...blankPolicy(), unidadId: current.unidadId }));
      setSamePolicyAndEndorsement(true); setSameEndorsementAndInciso(true);
      setCreateInitialEndorsement(true); setEndorsementNumber('000000'); setIncisoNumber('000000');
    } catch (error) { setPageError(error.message || 'No fue posible crear la póliza.'); }
    finally { setSubmitting(false); }
  }

  const canSubmitCard = isAdminGlobal && Boolean(targetCompanyId);
  const unitsOptions = useMemo(() => {
    const items = [...lookups.units];
    if (lastCreatedUnit && !items.some((item) => item.value === String(lastCreatedUnit.id))) items.unshift({ value: String(lastCreatedUnit.id), label: lastCreatedUnit.label });
    return items;
  }, [lookups.units, lastCreatedUnit]);
  const plateOptions = lookups.plates;

  if (!activeCompany?.id && !isAdminGlobal) return <Navigate to="/seleccionar-empresa" replace state={{ from: '/unidades/alta' }} />;

  return (
    <WorkspaceLayout activeNav="units">
      <section className="create-record-heading">
        <div className="create-record-title-group">
          <button className="create-back-button" type="button" onClick={() => navigate('/unidades')}><ArrowLeft size={17} /> Volver a unidades</button>
          <p className="workspace-eyebrow">ALTA DE REGISTROS</p>
          <h1>Crear registros</h1>
          <p className="workspace-subtitle">Registra unidades, movimientos de placas, tarjetas, pólizas y permisos especiales de la flota.</p>
        </div>
        <div className="create-company-chip"><Building2 size={16} /><span>{isAdminGlobal ? 'Ámbito administrador global' : activeCompany?.name}</span></div>
      </section>

      <div className="create-storage-note"><FileUp size={17} /><p><strong>Archivos adjuntos</strong> Se cargan por la API de archivos existente. El backend actual los guarda dentro de su carpeta <code>uploads/</code> y crea un registro en Archivos; esta pantalla no puede escribir directamente en el recurso compartido <code>10.0.0.39/Activos</code>.</p></div>

      {isAdminGlobal && <section className="create-company-picker"><Field label="Empresa actual / ámbito de registro" required><SelectInput value={targetCompanyId} onChange={(value) => { setTargetCompanyId(value); setPlateForm((current) => ({ ...current, empresaActualId: value })); }} options={currentCompanyOptions} required placeholder="Selecciona una empresa" /></Field><small>La empresa elegida se envía como X-Empresa-Id para las operaciones con ámbito de empresa.</small></section>}

      <nav className="create-record-tabs" aria-label="Tipo de registro">
        {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={activeTab === id ? 'is-active' : ''} onClick={() => changeTab(id)}><Icon size={17} /><span>{label}</span></button>)}
      </nav>

      {loadingLookups && <div className="create-inline-status"><span className="create-spinner" /> Consultando catálogos necesarios…</div>}
      {lookupError && <div className="create-alert is-warning" role="alert"><CircleAlert size={18} /><div><strong>No se pudieron cargar algunas listas</strong><p>{lookupError}</p></div><button type="button" onClick={() => { setLookupError(''); const controller = new AbortController(); loadLookups(controller.signal, activeTab, targetCompanyId); }}>Reintentar</button></div>}
      {pageError && <div className="create-alert is-error" role="alert"><CircleAlert size={18} /><p>{pageError}</p><button type="button" aria-label="Cerrar mensaje" onClick={() => setPageError('')}><X size={16} /></button></div>}
      {successMessage && <div className="create-alert is-success" role="status"><CheckCircle2 size={18} /><p>{successMessage}</p><button type="button" aria-label="Cerrar mensaje" onClick={() => setSuccessMessage('')}><X size={16} /></button></div>}

      {activeTab === 'unidad' && <form className="create-record-form" onSubmit={handleCreateUnit}>
        <SectionTitle icon={Truck} title="Datos de la unidad" subtitle="Los campos reflejan las columnas obligatorias del modelo Unidades actual." />
        <div className="create-form-grid">
          <Field label="No. económico" required><TextInput value={unitForm.noEconomico} onChange={updateUnit('noEconomico')} maxLength={15} required /></Field>
          <Field label="Estatus" required><SelectInput value={unitForm.status} onChange={updateUnit('status')} required options={[{ value: 'ALTA', label: 'Alta' }, { value: 'BAJA', label: 'Baja' }]} /></Field>
          <Field label="Tipo de unidad" required><SelectInput value={unitForm.tipoId} onChange={updateUnit('tipoId')} required options={lookups.types} /></Field>
          <Field label="Estado de unidad" required><SelectInput value={unitForm.estadoId} onChange={updateUnit('estadoId')} required options={lookups.states} /></Field>
          <Field label="Combustible" required><SelectInput value={unitForm.combustibleId} onChange={updateUnit('combustibleId')} required options={lookups.fuels} /></Field>
          <Field label="Año modelo" required><TextInput type="number" value={unitForm.anioModelo} onChange={updateUnit('anioModelo')} required min="1980" max={new Date().getFullYear() + 1} /></Field>
          <Field label="Marca" required><TextInput value={unitForm.marca} onChange={updateUnit('marca')} required maxLength={25} /></Field>
          <Field label="Modelo" required><TextInput value={unitForm.modelo} onChange={updateUnit('modelo')} required maxLength={25} /></Field>
          <Field label="Número de serie (VIN)" required><TextInput value={unitForm.noSerie} onChange={updateUnit('noSerie')} required maxLength={25} /></Field>
          <Field label="Número de motor" required><TextInput value={unitForm.noMotor} onChange={updateUnit('noMotor')} required maxLength={20} /></Field>
          <Field label="Ejes"><TextInput type="number" value={unitForm.ejes} onChange={updateUnit('ejes')} min="1" /></Field>
          <Field label="Llantas" required><TextInput type="number" value={unitForm.llantas} onChange={updateUnit('llantas')} required min="1" /></Field>
          <Field label="ViaPass" required><TextInput value={unitForm.viapass} onChange={updateUnit('viapass')} required maxLength={15} /></Field>
          <Field label="Fecha de alta SCT" required><TextInput type="date" value={unitForm.fechaAltaSCT} onChange={updateUnit('fechaAltaSCT')} required /></Field>
          <Field label="Valor factura" required><TextInput type="number" value={unitForm.valorFactura} onChange={updateUnit('valorFactura')} required min="0" step="0.01" /></Field>
          {isAdminGlobal && <Field label="Empresa propietaria" required><SelectInput value={unitForm.propietarioId || targetCompanyId} onChange={updateUnit('propietarioId')} required options={currentCompanyOptions} /></Field>}
        </div>
        <SectionTitle icon={ClipboardList} title="Verificaciones" subtitle="El modelo actual conserva una fecha y un costo vigente; no se genera historial." />
        <div className="create-form-grid">
          <Field label="Fecha verificación mecánica" required><TextInput type="date" value={unitForm.fechaVerificacionMecanica} onChange={updateUnit('fechaVerificacionMecanica')} required /></Field>
          <Field label="Costo verificación mecánica" required><TextInput type="number" value={unitForm.costoVerificacionMecanica} onChange={updateUnit('costoVerificacionMecanica')} required min="0" step="0.01" /></Field>
          <Field label="Periodo verificación mecánica" required><SelectInput value={unitForm.periodoVerificacionMecanicaId} onChange={updateUnit('periodoVerificacionMecanicaId')} required options={lookups.periods} /></Field>
          <FileField label="Constancia verificación mecánica" file={unitFiles.mecanica} onChange={(file) => setUnitFiles((current) => ({ ...current, mecanica: file }))} hint="PDF, JPG o PNG; máximo 5 MB según el backend." />
          <Field label="Fecha verificación contaminantes" required><TextInput type="date" value={unitForm.fechaVerificacionContaminantes} onChange={updateUnit('fechaVerificacionContaminantes')} required /></Field>
          <Field label="Costo verificación contaminantes" required><TextInput type="number" value={unitForm.costoVerificacionContaminantes} onChange={updateUnit('costoVerificacionContaminantes')} required min="0" step="0.01" /></Field>
          <Field label="Periodo verificación contaminantes" required><SelectInput value={unitForm.periodoVerificacionContaminantesId} onChange={updateUnit('periodoVerificacionContaminantesId')} required options={lookups.periods} /></Field>
          <FileField label="Constancia verificación contaminantes" file={unitFiles.contaminantes} onChange={(file) => setUnitFiles((current) => ({ ...current, contaminantes: file }))} />
          <FileField label="Factura de la unidad" file={unitFiles.factura} onChange={(file) => setUnitFiles((current) => ({ ...current, factura: file }))} />
        </div>
        <FormActions busy={submitting} label="Crear unidad" onCancel={() => navigate('/unidades')} />
      </form>}

      {activeTab === 'placa' && <form className="create-record-form" onSubmit={handleCreatePlate}>
        <SectionTitle icon={BadgeCheck} title="Datos de la placa" subtitle="Corresponde a Placas: número, estatus, propietario (opcional) y empresa actual. El identificador lo genera la base de datos." />
        <div className="create-form-grid">
          <Field label="Número de placas" required><TextInput value={plateForm.placas} onChange={updatePlate('placas')} required maxLength={10} placeholder="Ej. 12AB3C" /></Field>
          <Field label="Estatus" required><TextInput value={plateForm.status} onChange={updatePlate('status')} required maxLength={20} placeholder="Ej. ACTIVA" /></Field>
          {isAdminGlobal && <Field label="Empresa propietaria"><SelectInput value={plateForm.propietarioId} onChange={updatePlate('propietarioId')} options={currentCompanyOptions} placeholder="Sin propietario asignado" /></Field>}
          {!isAdminGlobal && <Field label="Empresa propietaria"><input value={activeCompany?.name || ''} disabled /></Field>}
          <Field label="Empresa actual" required><input value={currentCompanyOptions.find((item) => item.value === String(targetCompanyId))?.label || activeCompany?.name || ''} disabled /></Field>
        </div>
        <section className="create-endorsement-panel">
          <label className="create-checkbox-row"><input type="checkbox" checked={includePlateMovement} onChange={(event) => setIncludePlateMovement(event.target.checked)} /><span><strong>Registrar también un detalle de movimiento de la placa</strong><small>Corresponde a Detalle_placas: tipo de movimiento, costo, fecha y URL del comprobante. Puedes desmarcarlo si solo vas a dar de alta la placa.</small></span></label>
          {includePlateMovement && <>
            <SectionTitle icon={ClipboardList} title="Detalle del movimiento" subtitle="El detalle se registra después de crear la placa y queda relacionado mediante el ID generado." />
            <div className="create-form-grid">
              <Field label="Tipo de movimiento" required><SelectInput value={plateMovementForm.tipoMovimientoId} onChange={updatePlateMovement('tipoMovimientoId')} required options={lookups.movementTypes} disabled={loadingLookups} /></Field>
              <Field label="Costo del movimiento" required><TextInput type="number" value={plateMovementForm.costo} onChange={updatePlateMovement('costo')} required min="0" step="0.01" /></Field>
              <Field label="Fecha del movimiento" required><TextInput type="date" value={plateMovementForm.fecha} onChange={updatePlateMovement('fecha')} required /></Field>
              <FileField label="Comprobante del movimiento" file={plateMoveFile} onChange={setPlateMoveFile} required hint="PDF o imagen; el backend admite hasta 5 MB." />
            </div>
          </>}
        </section>
        <FormActions busy={submitting} label={includePlateMovement ? 'Crear placa y movimiento' : 'Crear placas'} onCancel={() => navigate('/unidades')} />
      </form>}

      {activeTab === 'doble-articulado' && <form className="create-record-form" onSubmit={(event) => handleCreateSpecialPermit(event, 'doble-articulado')}>
        <SectionTitle icon={Truck} title="Permiso de doble articulado" subtitle="Se registra en Doble_articulado y queda asociado a una unidad existente." />
        <div className="create-form-grid">
          <Field label="Unidad" required><SelectInput value={doubleArticulatedForm.unidadId} onChange={updateDoubleArticulated('unidadId')} required options={unitsOptions} disabled={loadingLookups || !targetCompanyId} /></Field>
          <Field label="Número de permiso" required><TextInput value={doubleArticulatedForm.permiso} onChange={updateDoubleArticulated('permiso')} required maxLength={30} /></Field>
          <Field label="Fecha de obtención" required><TextInput type="date" value={doubleArticulatedForm.fechaObtencion} onChange={updateDoubleArticulated('fechaObtencion')} required /></Field>
          <Field label="Fecha de vencimiento" required><TextInput type="date" value={doubleArticulatedForm.fechaVencimiento} onChange={updateDoubleArticulated('fechaVencimiento')} required min={doubleArticulatedForm.fechaObtencion} /></Field>
          <FileField label="Documento del permiso" file={doubleArticulatedFile} onChange={setDoubleArticulatedFile} required hint="PDF, JPG o PNG; máximo 5 MB." />
        </div>
        <FormActions busy={submitting} label="Crear permiso de doble articulado" onCancel={() => navigate('/unidades')} />
      </form>}

      {activeTab === 'sict' && <form className="create-record-form" onSubmit={(event) => handleCreateSpecialPermit(event, 'sict')}>
        <SectionTitle icon={ShieldCheck} title="Permiso SICT" subtitle="Se registra en SICT y queda asociado a una unidad existente." />
        <div className="create-form-grid">
          <Field label="Unidad" required><SelectInput value={sictForm.unidadId} onChange={updateSict('unidadId')} required options={unitsOptions} disabled={loadingLookups || !targetCompanyId} /></Field>
          <Field label="Número de permiso SICT" required><TextInput value={sictForm.permiso} onChange={updateSict('permiso')} required maxLength={30} /></Field>
          <Field label="Fecha de obtención" required><TextInput type="date" value={sictForm.fechaObtencion} onChange={updateSict('fechaObtencion')} required /></Field>
          <Field label="Fecha de vencimiento" required><TextInput type="date" value={sictForm.fechaVencimiento} onChange={updateSict('fechaVencimiento')} required min={sictForm.fechaObtencion} /></Field>
          <FileField label="Documento del permiso SICT" file={sictFile} onChange={setSictFile} required hint="PDF, JPG o PNG; máximo 5 MB." />
        </div>
        <FormActions busy={submitting} label="Crear permiso SICT" onCancel={() => navigate('/unidades')} />
      </form>}

      {activeTab === 'tarjeta' && <form className="create-record-form" onSubmit={handleCreateCard}>
        <SectionTitle icon={ClipboardList} title="Tarjeta de circulación" subtitle="Se vincula obligatoriamente a una unidad y una placa existentes." />
        {!isAdminGlobal && <div className="create-alert is-warning"><ShieldAlert size={18} /><p>El backend actual permite crear y modificar tarjetas de circulación únicamente a ADMIN_GLOBAL. Puedes revisar esta sección, pero no enviar el formulario con otro rol.</p></div>}
        <div className="create-form-grid">
          <Field label="Unidad" required><SelectInput value={cardForm.unidadId} onChange={updateCard('unidadId')} required options={unitsOptions} disabled={loadingLookups || !targetCompanyId} /></Field>
          <Field label="Placas" required><SelectInput value={cardForm.placasId} onChange={updateCard('placasId')} required options={plateOptions} disabled={loadingLookups || !targetCompanyId} /></Field>
          <Field label="Número de tarjeta" required><TextInput value={cardForm.tarjeta} onChange={updateCard('tarjeta')} required maxLength={50} /></Field>
          <Field label="Tipo de tarjeta" required><SelectInput value={cardForm.tipoId} onChange={updateCard('tipoId')} required options={lookups.cardTypes} /></Field>
          <Field label="Estatus" required><TextInput value={cardForm.status} onChange={updateCard('status')} required maxLength={20} /></Field>
          <Field label="Número original"><TextInput value={cardForm.noOriginal} onChange={updateCard('noOriginal')} maxLength={50} /></Field>
          <Field label="Costo" required><TextInput type="number" value={cardForm.costo} onChange={updateCard('costo')} required min="0" step="0.01" /></Field>
          <Field label="Fecha de obtención" required><TextInput type="date" value={cardForm.fechaObtencion} onChange={updateCard('fechaObtencion')} required /></Field>
          <Field label="Fecha de vencimiento"><TextInput type="date" value={cardForm.fechaVencimiento} onChange={updateCard('fechaVencimiento')} /></Field>
          <Field label="Fecha de reposición"><TextInput type="date" value={cardForm.fechaReposicion} onChange={updateCard('fechaReposicion')} /></Field>
          <Field label="Costo de reposición"><TextInput type="number" value={cardForm.costoReposicion} onChange={updateCard('costoReposicion')} min="0" step="0.01" /></Field>
          <FileField label="Documento de tarjeta" file={cardFile} onChange={setCardFile} required hint="Obligatorio para guardar el registro." />
          <FileField label="Documento de reposición" file={cardReplacementFile} onChange={setCardReplacementFile} />
        </div>
        <FormActions busy={submitting || !canSubmitCard} label="Crear tarjeta de circulación" onCancel={() => navigate('/unidades')} disabled={!canSubmitCard} />
      </form>}

      {activeTab === 'poliza' && <form className="create-record-form" onSubmit={handleCreatePolicy}>
        <SectionTitle icon={FileUp} title="Registrar póliza" subtitle="Se puede crear la póliza sola o con su endoso e inciso inicial." />
        <div className="create-form-grid">
          <Field label="Unidad asegurada" required><SelectInput value={policyForm.unidadId} onChange={updatePolicy('unidadId')} required options={unitsOptions} disabled={loadingLookups || !targetCompanyId} /></Field>
          <Field label="Número de póliza" required><TextInput value={policyForm.poliza} onChange={updatePolicy('poliza')} required maxLength={15} /></Field>
          <Field label="Aseguradora" required><SelectInput value={policyForm.aseguradoraId} onChange={updatePolicy('aseguradoraId')} required options={lookups.insurers} /></Field>
          <Field label="Tipo de póliza" required><SelectInput value={policyForm.tipoPolizaId} onChange={updatePolicy('tipoPolizaId')} required options={lookups.policyTypes} /></Field>
          <Field label="Fecha de inicio" required><TextInput type="date" value={policyForm.fechaInicio} onChange={updatePolicy('fechaInicio')} required /></Field>
          <Field label="Fecha de fin" required><TextInput type="date" value={policyForm.fechaFin} onChange={updatePolicy('fechaFin')} required min={policyForm.fechaInicio} /></Field>
          <Field label="Costo" required><TextInput type="number" value={policyForm.costo} onChange={updatePolicy('costo')} required min="0" step="0.01" /></Field>
          <FileField label="Archivo de póliza" file={policyFile} onChange={setPolicyFile} required hint="PDF, JPG o PNG; máximo 5 MB." />
        </div>
        <section className="create-endorsement-panel">
          <label className="create-checkbox-row"><input type="checkbox" checked={createInitialEndorsement} onChange={(event) => setCreateInitialEndorsement(event.target.checked)} /><span><strong>Crear también el endoso e inciso iniciales</strong><small>Se usan los números 000000 por defecto y se pueden editar.</small></span></label>
          {createInitialEndorsement && <>
            <div className="create-form-grid create-nested-grid">
              <Field label="Número de endoso" required><TextInput value={endorsementNumber} onChange={setEndorsementNumber} required maxLength={6} /></Field>
              <Field label="Número de inciso" required><TextInput value={incisoNumber} onChange={setIncisoNumber} required maxLength={6} /></Field>
            </div>
            <label className="create-checkbox-row"><input type="checkbox" checked={samePolicyAndEndorsement} onChange={(event) => setSamePolicyAndEndorsement(event.target.checked)} /><span><strong>El endoso utiliza el mismo archivo que la póliza</strong><small>Activado: el sistema reutiliza la misma URL y no vuelve a subir el documento.</small></span></label>
            {!samePolicyAndEndorsement && <FileField label="Archivo del endoso" file={endorsementFile} onChange={setEndorsementFile} required hint="Se guardará una referencia independiente para el endoso." />}
            <label className="create-checkbox-row"><input type="checkbox" checked={sameEndorsementAndInciso} onChange={(event) => setSameEndorsementAndInciso(event.target.checked)} /><span><strong>El inciso utiliza el mismo archivo que el endoso</strong><small>Activado: no se crea una segunda copia para el inciso.</small></span></label>
            {!sameEndorsementAndInciso && <FileField label="Archivo del inciso" file={incisoFile} onChange={setIncisoFile} required hint="Solo se sube si el inciso tiene un documento distinto." />}
          </>}
        </section>
        <FormActions busy={submitting} label={createInitialEndorsement ? 'Crear póliza, endoso e inciso' : 'Crear póliza'} onCancel={() => navigate('/unidades')} />
      </form>}

      <p className="create-schema-note">Este formulario sigue el contrato de los endpoints y los campos de la base de datos oficial revisados para Activos. Si un catálogo está vacío o el backend devuelve un error de autorización, la pantalla no inventa opciones ni IDs.</p>
    </WorkspaceLayout>
  );
}

function FormActions({ busy, label, onCancel, disabled = false }) {
  return <div className="create-form-actions"><button type="button" className="workspace-secondary-button" onClick={onCancel} disabled={busy}>Cancelar</button><button type="submit" className="workspace-primary-button" disabled={busy || disabled}>{busy ? <><span className="create-spinner" /> Guardando…</> : <><Plus size={16} /> {label}</>}</button></div>;
}
