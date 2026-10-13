// ============================================================
// IMPORTACIONES: ninguna (datos puros)
// ============================================================

export const MOCK_EMPRESAS = [
  { Emp_id: 1, Emp_nombre: 'Transportes del Norte S.A. de C.V.', Emp_nombre_corto: 'TDN', Emp_direccion: 'Av. Industrial 450, Monterrey, NL', Emp_rfc: 'TDN180520AB1' },
  { Emp_id: 2, Emp_nombre: 'Logística Express México S.A.', Emp_nombre_corto: 'LEM', Emp_direccion: 'Blvd. Manuel Ávila Camacho 120, CDMX', Emp_rfc: 'LEM190315CD2' },
  { Emp_id: 3, Emp_nombre: 'Carga Pesada del Pacífico S.A.', Emp_nombre_corto: 'CPP', Emp_direccion: 'Carretera Guadalajara 890, Guadalajara, JAL', Emp_rfc: 'CPP170822EF3' },
  { Emp_id: 4, Emp_nombre: 'Autotransportes Bajío S.A. de C.V.', Emp_nombre_corto: 'ABJ', Emp_direccion: 'Paseo de la Presa 340, León, GTO', Emp_rfc: 'ABJ200110GH4' },
];

export const MOCK_TIPO_UNIDAD = [
  { TpU_id: 1, TpU_nombre: 'Tractocamión', TpU_nombre_corto: 'TRACT' },
  { TpU_id: 2, TpU_nombre: 'Camión de carga', TpU_nombre_corto: 'CARGA' },
  { TpU_id: 3, TpU_nombre: 'Autobús', TpU_nombre_corto: 'BUS' },
  { TpU_id: 4, TpU_nombre: 'Camioneta', TpU_nombre_corto: 'CAMIO' },
  { TpU_id: 5, TpU_nombre: 'Tráiler', TpU_nombre_corto: 'TRAIL' },
];

export const MOCK_ESTADO_UNIDAD = [
  { EsU_id: 1, EsU_estado: 'Operativa' },
  { EsU_id: 2, EsU_estado: 'En mantenimiento' },
  { EsU_id: 3, EsU_estado: 'Fuera de servicio' },
  { EsU_id: 4, EsU_estado: 'En taller' },
];

export const MOCK_COMBUSTIBLE = [
  { Com_id: 1, Com_nombre: 'Diésel' },
  { Com_id: 2, Com_nombre: 'Gasolina' },
  { Com_id: 3, Com_nombre: 'Gas Natural' },
  { Com_id: 4, Com_nombre: 'Híbrido' },
];

export const MOCK_PERIODOS = [
  { Per_id: 1, Per_nombre: 'Ene-Jun 2024' },
  { Per_id: 2, Per_nombre: 'Jul-Dic 2024' },
  { Per_id: 3, Per_nombre: 'Ene-Jun 2025' },
  { Per_id: 4, Per_nombre: 'Jul-Dic 2025' },
];

export const MOCK_UNIDADES = [
  {
    Uni_id: 1, Uni_no_economico: 'UN-001', Uni_status: 'ALTA', Uni_tipo: 1, Uni_estado: 1,
    Uni_combustible: 1, Uni_no_serie: '1HGBH41JXMN109186', Uni_no_motor: 'MTR-45821',
    Uni_anio_modelo: 2022, Uni_modelo: 'FH16', Uni_marca: 'Volvo', Uni_ejes: 3, Uni_llantas: 10,
    Uni_viapass: 'VIA-2024-001', Uni_propietario: 1, Uni_empresa_actual: 1,
    Uni_fecha_alta_SCT: '2022-03-15', Uni_valor_factura: 2850000.00,
    Uni_fecha_verificacion_mecanica: '2024-06-10', Uni_costo_verificacion_mecanica: 4500.00,
    Uni_periodo_verificacion_mecanica: 2,
    Uni_fecha_verificacion_contaminantes: '2024-07-01', Uni_costo_verificacion_contaminantes: 1200.00,
    Uni_periodo_verificacion_contaminantes: 2,
  },
  {
    Uni_id: 2, Uni_no_economico: 'UN-002', Uni_status: 'ALTA', Uni_tipo: 2, Uni_estado: 1,
    Uni_combustible: 1, Uni_no_serie: '2HGBH41JXMN109187', Uni_no_motor: 'MTR-45822',
    Uni_anio_modelo: 2023, Uni_modelo: 'Actros 2651', Uni_marca: 'Mercedes-Benz', Uni_ejes: 3, Uni_llantas: 10,
    Uni_viapass: 'VIA-2024-002', Uni_propietario: 1, Uni_empresa_actual: 1,
    Uni_fecha_alta_SCT: '2023-01-20', Uni_valor_factura: 3200000.00,
    Uni_fecha_verificacion_mecanica: '2024-08-15', Uni_costo_verificacion_mecanica: 4800.00,
    Uni_periodo_verificacion_mecanica: 2,
    Uni_fecha_verificacion_contaminantes: '2024-09-01', Uni_costo_verificacion_contaminantes: 1300.00,
    Uni_periodo_verificacion_contaminantes: 2,
  },
  {
    Uni_id: 3, Uni_no_economico: 'UN-003', Uni_status: 'ALTA', Uni_tipo: 3, Uni_estado: 2,
    Uni_combustible: 1, Uni_no_serie: '3HGBH41JXMN109188', Uni_no_motor: 'MTR-45823',
    Uni_anio_modelo: 2021, Uni_modelo: 'X3-450', Uni_marca: 'Volvo', Uni_ejes: 2, Uni_llantas: 6,
    Uni_viapass: 'VIA-2024-003', Uni_propietario: 2, Uni_empresa_actual: 2,
    Uni_fecha_alta_SCT: '2021-06-10', Uni_valor_factura: 4500000.00,
    Uni_fecha_verificacion_mecanica: '2024-05-20', Uni_costo_verificacion_mecanica: 5200.00,
    Uni_periodo_verificacion_mecanica: 1,
    Uni_fecha_verificacion_contaminantes: '2024-06-15', Uni_costo_verificacion_contaminantes: 1500.00,
    Uni_periodo_verificacion_contaminantes: 1,
  },
  {
    Uni_id: 4, Uni_no_economico: 'UN-004', Uni_status: 'BAJA', Uni_tipo: 4, Uni_estado: 3,
    Uni_combustible: 2, Uni_no_serie: '4HGBH41JXMN109189', Uni_no_motor: 'MTR-45824',
    Uni_anio_modelo: 2019, Uni_modelo: 'F-150', Uni_marca: 'Ford', Uni_ejes: 2, Uni_llantas: 4,
    Uni_viapass: 'VIA-2024-004', Uni_propietario: 3, Uni_empresa_actual: 3,
    Uni_fecha_alta_SCT: '2019-11-05', Uni_valor_factura: 850000.00,
    Uni_fecha_verificacion_mecanica: '2023-12-10', Uni_costo_verificacion_mecanica: 3200.00,
    Uni_periodo_verificacion_mecanica: 4,
    Uni_fecha_verificacion_contaminantes: '2024-01-15', Uni_costo_verificacion_contaminantes: 900.00,
    Uni_periodo_verificacion_contaminantes: 1,
  },
  {
    Uni_id: 5, Uni_no_economico: 'UN-005', Uni_status: 'ALTA', Uni_tipo: 5, Uni_estado: 1,
    Uni_combustible: 1, Uni_no_serie: '5HGBH41JXMN109190', Uni_no_motor: 'MTR-45825',
    Uni_anio_modelo: 2024, Uni_modelo: 'T880', Uni_marca: 'Kenworth', Uni_ejes: 4, Uni_llantas: 18,
    Uni_viapass: 'VIA-2024-005', Uni_propietario: 4, Uni_empresa_actual: 4,
    Uni_fecha_alta_SCT: '2024-02-28', Uni_valor_factura: 3800000.00,
    Uni_fecha_verificacion_mecanica: '2024-10-01', Uni_costo_verificacion_mecanica: 5500.00,
    Uni_periodo_verificacion_mecanica: 3,
    Uni_fecha_verificacion_contaminantes: '2024-10-15', Uni_costo_verificacion_contaminantes: 1400.00,
    Uni_periodo_verificacion_contaminantes: 3,
  },
];

export const MOCK_ASEGURADORAS = [
  { Ase_id: 1, Ase_nombre: 'GNP Seguros', Ase_direccion: 'Av. Paseo de la Reforma 250, CDMX', Ase_telefono: '5551234567', Ase_rfc: 'GSE920101AB1' },
  { Ase_id: 2, Ase_nombre: 'AXA Seguros México', Ase_direccion: 'Blvd. Manuel Ávila Camacho 1, CDMX', Ase_telefono: '5559876543', Ase_rfc: 'ASM930202CD2' },
  { Ase_id: 3, Ase_nombre: 'Qualitas Compañía de Seguros', Ase_direccion: 'Av. Insurgentes Sur 1602, CDMX', Ase_telefono: '5554567890', Ase_rfc: 'QCS910303EF3' },
];

export const MOCK_TIPO_POLIZA = [
  { TpP_id: 1, TpP_nombre: 'Cobertura amplia' },
  { TpP_id: 2, TpP_nombre: 'Cobertura limitada' },
  { TpP_id: 3, TpP_nombre: 'Responsabilidad civil' },
  { TpP_id: 4, TpP_nombre: 'Cobertura contra terceros' },
];

export const MOCK_POLIZAS = [
  { Pol_id: 1, Pol_poliza: 'POL-2024-001', Pol_aseguradora: 1, Pol_unidad_id: 1, Pol_tipo_poliza: 1, Pol_fecha_inicio: '2024-01-01', Pol_fecha_fin: '2024-12-31', Pol_costo: 125000.00, endosos: [{ End_id: 1, End_endoso: 'E001', End_poliza: 1, incisos: [{ Inc_id: 1, Inc_endoso: 1, Inc_inciso: 'I001' }] }] },
  { Pol_id: 2, Pol_poliza: 'POL-2024-002', Pol_aseguradora: 2, Pol_unidad_id: 2, Pol_tipo_poliza: 1, Pol_fecha_inicio: '2024-03-01', Pol_fecha_fin: '2025-02-28', Pol_costo: 138000.00, endosos: [] },
  { Pol_id: 3, Pol_poliza: 'POL-2024-003', Pol_aseguradora: 3, Pol_unidad_id: 3, Pol_tipo_poliza: 2, Pol_fecha_inicio: '2024-06-01', Pol_fecha_fin: '2025-05-31', Pol_costo: 95000.00, endosos: [] },
  { Pol_id: 4, Pol_poliza: 'POL-2024-004', Pol_aseguradora: 1, Pol_unidad_id: 5, Pol_tipo_poliza: 1, Pol_fecha_inicio: '2024-02-01', Pol_fecha_fin: '2025-01-31', Pol_costo: 142000.00, endosos: [] },
];

export const MOCK_PLACAS = [
  { Pla_id: 1, Pla_placas: 'ABC-1234', Pla_status: 'Vigente', Pla_propietario: 1, Pla_empresa_actual: 1 },
  { Pla_id: 2, Pla_placas: 'DEF-5678', Pla_status: 'Vigente', Pla_propietario: 1, Pla_empresa_actual: 1 },
  { Pla_id: 3, Pla_placas: 'GHI-9012', Pla_status: 'Vigente', Pla_propietario: 2, Pla_empresa_actual: 2 },
  { Pla_id: 4, Pla_placas: 'JKL-3456', Pla_status: 'Baja', Pla_propietario: 3, Pla_empresa_actual: 3 },
  { Pla_id: 5, Pla_placas: 'MNO-7890', Pla_status: 'Vigente', Pla_propietario: 4, Pla_empresa_actual: 4 },
];

export const MOCK_TIPO_MOVIMIENTO_PLACA = [
  { TpMP_id: 1, TpMP_nombre: 'Alta' },
  { TpMP_id: 2, TpMP_nombre: 'Baja' },
  { TpMP_id: 3, TpMP_nombre: 'Cambio de propietario' },
  { TpMP_id: 4, TpMP_nombre: 'Reposición' },
];

export const MOCK_TIPO_TARJETA = [
  { TpT_id: 1, TpT_nombre: 'Federal' },
  { TpT_id: 2, TpT_nombre: 'Estatal' },
  { TpT_id: 3, TpT_nombre: 'Foránea' },
];

export const MOCK_TARJETAS = [
  { TC_id: 1, TC_tarjeta: 'TC-2024-001', TC_unidad_id: 1, TC_costo: 3500.00, TC_tipo: 1, TC_status: 'Vigente', TC_no_original: 'ORG-001', TC_placas_id: 1, TC_fecha_obtencion: '2022-03-20', TC_fecha_vencimiento: '2025-03-20' },
  { TC_id: 2, TC_tarjeta: 'TC-2024-002', TC_unidad_id: 2, TC_costo: 3500.00, TC_tipo: 1, TC_status: 'Vigente', TC_no_original: 'ORG-002', TC_placas_id: 2, TC_fecha_obtencion: '2023-01-25', TC_fecha_vencimiento: '2026-01-25' },
  { TC_id: 3, TC_tarjeta: 'TC-2024-003', TC_unidad_id: 3, TC_costo: 2800.00, TC_tipo: 2, TC_status: 'Por vencer', TC_no_original: 'ORG-003', TC_placas_id: 3, TC_fecha_obtencion: '2021-06-15', TC_fecha_vencimiento: '2024-12-15' },
  { TC_id: 4, TC_tarjeta: 'TC-2024-004', TC_unidad_id: 5, TC_costo: 3500.00, TC_tipo: 1, TC_status: 'Vigente', TC_no_original: 'ORG-004', TC_placas_id: 5, TC_fecha_obtencion: '2024-03-01', TC_fecha_vencimiento: '2027-03-01' },
];

export const MOCK_USUARIOS = [
  { Usu_id: 1, Usu_nombres: 'Carlos', Usu_ap_paterno: 'Martínez', Usu_ap_materno: 'López', Usu_telefono: '5551234567', Usu_correo: 'carlos.martinez@tdn.com', Usu_status: 'ACTIVO', Usu_fecha_creacion: '2023-01-15', Usu_ultimo_acceso: '2024-11-20' },
  { Usu_id: 2, Usu_nombres: 'Ana', Usu_ap_paterno: 'García', Usu_ap_materno: 'Sánchez', Usu_telefono: '5559876543', Usu_correo: 'ana.garcia@lem.com', Usu_status: 'ACTIVO', Usu_fecha_creacion: '2023-03-20', Usu_ultimo_acceso: '2024-11-19' },
  { Usu_id: 3, Usu_nombres: 'Roberto', Usu_ap_paterno: 'Hernández', Usu_ap_materno: 'Ramírez', Usu_telefono: '5554567890', Usu_correo: 'roberto.hernandez@cpp.com', Usu_status: 'ACTIVO', Usu_fecha_creacion: '2023-06-10', Usu_ultimo_acceso: '2024-11-18' },
  { Usu_id: 4, Usu_nombres: 'María', Usu_ap_paterno: 'López', Usu_ap_materno: 'Torres', Usu_telefono: '5553216549', Usu_correo: 'maria.lopez@abj.com', Usu_status: 'INACTIVO', Usu_fecha_creacion: '2022-11-05', Usu_ultimo_acceso: '2024-08-15' },
];

export const MOCK_ROLES = [
  { Rol_id: 1, Rol_nombre: 'Administrador' },
  { Rol_id: 2, Rol_nombre: 'Operador' },
  { Rol_id: 3, Rol_nombre: 'Consultor' },
  { Rol_id: 4, Rol_nombre: 'Supervisor' },
];