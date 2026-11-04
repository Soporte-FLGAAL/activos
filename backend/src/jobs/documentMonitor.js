
const cron = require('node-cron');
const db = require('../config/database');
const { enviarCorreo } = require('../services/email.service');

const ROL_ADMIN_GLOBAL = 'ADMIN_GLOBAL';
const ROL_ADMIN = 'ADMIN';
const CONCURRENCIA_ENVIOS = 5;
let cacheEmpresas = null;

const MONITOREOS = [
  {
    tabla: 'Unidades',
    query: `
      SELECT u.Uni_empresa_actual AS empresa_id,
             u.Uni_id AS unidad_id,
             u.Uni_no_economico AS unidad_referencia,
             u.Uni_factura_url,
             u.Uni_url_verificacion_mecanica,
             u.Uni_url_verificacion_contaminantes
      FROM Unidades u
      WHERE u.Uni_factura_url IS NULL OR u.Uni_factura_url = ''
         OR u.Uni_url_verificacion_mecanica IS NULL OR u.Uni_url_verificacion_mecanica = ''
         OR u.Uni_url_verificacion_contaminantes IS NULL OR u.Uni_url_verificacion_contaminantes = ''
    `,
    describir: (r) => {
      const faltantes = [];
      if (!r.Uni_factura_url) faltantes.push('factura');
      if (!r.Uni_url_verificacion_mecanica) faltantes.push('verificación mecánica');
      if (!r.Uni_url_verificacion_contaminantes) faltantes.push('verificación de contaminantes');
      return faltantes;
    },
  },
  {
    tabla: 'Polizas',
    query: `
      SELECT u.Uni_empresa_actual AS empresa_id,
             u.Uni_id AS unidad_id,
             u.Uni_no_economico AS unidad_referencia,
             p.Pol_id AS id,
             p.Pol_poliza AS referencia
      FROM Polizas p
      JOIN Unidades u ON p.Pol_unidad_id = u.Uni_id
      WHERE p.Pol_url IS NULL OR p.Pol_url = ''
    `,
    describir: (r) => 'póliza ' + r.referencia,
  },
  {
    tabla: 'Endoso',
    query: `
      SELECT u.Uni_empresa_actual AS empresa_id,
             u.Uni_id AS unidad_id,
             u.Uni_no_economico AS unidad_referencia,
             e.End_id AS id,
             e.End_endoso AS referencia
      FROM Endoso e
      JOIN Polizas p ON e.End_poliza = p.Pol_id
      JOIN Unidades u ON p.Pol_unidad_id = u.Uni_id
      WHERE e.End_url IS NULL OR e.End_url = ''
    `,
    describir: (r) => 'endoso ' + r.referencia,
  },
  {
    tabla: 'Inciso',
    query: `
      SELECT u.Uni_empresa_actual AS empresa_id,
             u.Uni_id AS unidad_id,
             u.Uni_no_economico AS unidad_referencia,
             i.Inc_id AS id,
             i.Inc_inciso AS referencia
      FROM Inciso i
      JOIN Endoso e ON i.Inc_endoso = e.End_id
      JOIN Polizas p ON e.End_poliza = p.Pol_id
      JOIN Unidades u ON p.Pol_unidad_id = u.Uni_id
      WHERE i.Inc_url IS NULL OR i.Inc_url = ''
    `,
    describir: (r) => 'inciso ' + r.referencia,
  },
  {
    tabla: 'Detalle_placas',
    query: `
      SELECT DISTINCT
             p.Pla_empresa_actual AS empresa_id,
             u.Uni_id AS unidad_id,
             u.Uni_no_economico AS unidad_referencia,
             p.Pla_id AS placa_id,
             p.Pla_placas AS placa_referencia
      FROM Detalle_placas dp
      JOIN Placas p ON dp.DP_placas_id = p.Pla_id
      LEFT JOIN (
        SELECT TC_placas_id, MIN(TC_unidad_id) AS unidad_id
        FROM Tarjeta_circulacion
        GROUP BY TC_placas_id
        HAVING COUNT(DISTINCT TC_unidad_id) = 1
      ) tc_unit ON tc_unit.TC_placas_id = p.Pla_id
      LEFT JOIN Unidades u
             ON u.Uni_id = tc_unit.unidad_id
            AND u.Uni_empresa_actual = p.Pla_empresa_actual
      WHERE dp.DP_url IS NULL OR dp.DP_url = ''
    `,
    describir: () => 'comprobante de movimiento de placas',
  },
  {
    tabla: 'Tarjeta_circulacion',
    query: `
      SELECT u.Uni_empresa_actual AS empresa_id,
             u.Uni_id AS unidad_id,
             u.Uni_no_economico AS unidad_referencia,
             tc.TC_id AS id,
             tc.TC_tarjeta AS referencia
      FROM Tarjeta_circulacion tc
      JOIN Unidades u ON tc.TC_unidad_id = u.Uni_id
      WHERE tc.TC_url IS NULL OR tc.TC_url = ''
    `,
    describir: (r) => 'tarjeta de circulación ' + r.referencia,
  },
  {
    tabla: 'Doble_articulado',
    query: `
      SELECT u.Uni_empresa_actual AS empresa_id,
             u.Uni_id AS unidad_id,
             u.Uni_no_economico AS unidad_referencia,
             pda.PDA_id AS id,
             pda.PDA_permiso AS referencia
      FROM Doble_articulado pda
      JOIN Unidades u ON pda.PDA_unidad_id = u.Uni_id
      WHERE pda.PDA_url IS NULL OR pda.PDA_url = ''
    `,
    describir: (r) => 'permiso de doble articulado ' + r.referencia,
  },
  {
    tabla: 'SICT',
    query: `
      SELECT u.Uni_empresa_actual AS empresa_id,
             u.Uni_id AS unidad_id,
             u.Uni_no_economico AS unidad_referencia,
             s.SICT_id AS id,
             s.SICT_permiso AS referencia
      FROM SICT s
      JOIN Unidades u ON s.SICT_unidad_id = u.Uni_id
      WHERE s.SICT_url IS NULL OR s.SICT_url = ''
    `,
    describir: (r) => 'permiso SICT ' + r.referencia,
  },
];

async function obtenerEmpresas() {
  if (cacheEmpresas) return cacheEmpresas;
  const [rows] = await db.query('SELECT Emp_id, Emp_nombre FROM Empresas');
  cacheEmpresas = rows;
  return cacheEmpresas;
}

async function recolectarTodasLasIncidencias() {
  const agrupado = new Map();

  function agregarDocumento(registro, documento, tipoRegistro = 'unidad') {
    const empresaKey = String(registro.empresa_id);
    if (!agrupado.has(empresaKey)) agrupado.set(empresaKey, new Map());

    const porEmpresa = agrupado.get(empresaKey);
    const esUnidad = registro.unidad_id != null;
    const tipo = esUnidad ? 'unidad' : tipoRegistro;
    const registroId = esUnidad ? 'unidad:' + registro.unidad_id : 'placa:' + registro.placa_id;
    const referencia = esUnidad
      ? (registro.unidad_referencia ?? registro.unidad_id)
      : (registro.placa_referencia ?? registro.placa_id);

    if (!porEmpresa.has(registroId)) {
      porEmpresa.set(registroId, { tipo, referencia, documentos: new Set() });
    }
    porEmpresa.get(registroId).documentos.add(documento);
  }

  for (const monitoreo of MONITOREOS) {
    const [registros] = await db.query(monitoreo.query);
    for (const registro of registros) {
      const resultado = monitoreo.describir(registro);
      const documentos = Array.isArray(resultado) ? resultado : [resultado];
      for (const documento of documentos) {
        agregarDocumento(
          registro,
          documento,
          monitoreo.tabla === 'Detalle_placas' ? 'placa' : 'unidad'
        );
      }
    }
  }
  return agrupado;
}

async function obtenerDestinatarios() {
  const [adminsPorEmpresa] = await db.query(
    `SELECT ue.UE_empresa AS empresa_id, u.Usu_correo
     FROM Usuario u
     JOIN Usuario_Empresas ue ON u.Usu_id = ue.UE_usuario
     JOIN Roles r ON ue.UE_rol = r.Rol_id
     WHERE r.Rol_nombre = ? AND u.Usu_status = 'ACTIVO'`,
    [ROL_ADMIN]
  );

  const [adminsGlobales] = await db.query(
    `SELECT DISTINCT u.Usu_correo
     FROM Usuario u
     JOIN Usuario_Empresas ue ON u.Usu_id = ue.UE_usuario
     JOIN Roles r ON ue.UE_rol = r.Rol_id
     WHERE r.Rol_nombre = ? AND u.Usu_status = 'ACTIVO'`,
    [ROL_ADMIN_GLOBAL]
  );

  const mapaPorEmpresa = new Map();
  for (const row of adminsPorEmpresa) {
    const empresaKey = String(row.empresa_id);
    if (!mapaPorEmpresa.has(empresaKey)) mapaPorEmpresa.set(empresaKey, []);
    mapaPorEmpresa.get(empresaKey).push(row.Usu_correo);
  }

  return {
    adminsPorEmpresa: mapaPorEmpresa,
    adminsGlobales: adminsGlobales.map((row) => row.Usu_correo),
  };
}

function escaparHtml(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (caracter) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[caracter]);
}

function formatearLineas(porRegistro) {
  return Array.from(porRegistro.values())
    .map((registro) => {
      const prefijo = registro.tipo === 'placa' ? 'Placa' : 'Unidad';
      const documentos = Array.from(registro.documentos);
      return prefijo + ' ' + registro.referencia + ': ' + documentos.join(', ');
    })
    .sort((a, b) => a.localeCompare(b, 'es-MX'));
}

function construirHtml(grupos) {
  let html = '<h2>DOCUMENTOS FALTANTES</h2>';
  for (const grupo of grupos) {
    if (grupo.empresa) html += '<h3>' + escaparHtml(grupo.empresa) + '</h3>';
    for (const linea of grupo.lineas) {
      html += '<p style="margin: 0 0 8px 0;">' + escaparHtml(linea) + '</p>';
    }
  }
  return html;
}

async function conLimite(items, limite, fn) {
  let indice = 0;
  async function worker() {
    while (indice < items.length) {
      const i = indice++;
      try {
        await fn(items[i], i);
      } catch (err) {
        console.error('[worker] Error procesando item ' + i + ':', err.message);
      }
    }
  }
  const workers = Array.from({ length: Math.min(limite, items.length) }, worker);
  await Promise.all(workers);
}

async function reportarPorEmpresa(incidenciasPorEmpresa, adminsPorEmpresa, empresas) {
  const tareas = [];
  for (const empresa of empresas) {
    const admins = adminsPorEmpresa.get(String(empresa.Emp_id));
    if (!admins?.length) continue;
    const porRegistro = incidenciasPorEmpresa.get(String(empresa.Emp_id));
    if (!porRegistro?.size) continue;
    const lineas = formatearLineas(porRegistro);
    if (!lineas.length) continue;
    tareas.push({ empresa, admins, lineas, total: lineas.length });
  }

  await conLimite(tareas, CONCURRENCIA_ENVIOS, async ({ empresa, admins, lineas, total }) => {
    const html = construirHtml([{ lineas }]);
    try {
      await enviarCorreo(admins.join(','), 'DOCUMENTOS FALTANTES', html);
      console.log('[OK] Reporte enviado a ' + admins.length + ' admin(s) de ' + empresa.Emp_nombre + ' (' + total + ' unidades/registros con faltantes).');
    } catch (err) {
      console.error('[FAIL] No se pudo enviar reporte de ' + empresa.Emp_nombre + ':', err.message);
    }
  });
}

async function reportarConsolidadoGlobal(incidenciasPorEmpresa, adminsGlobales, empresas) {
  if (adminsGlobales.length === 0) return;
  const grupos = [];

  for (const empresa of empresas) {
    const porRegistro = incidenciasPorEmpresa.get(String(empresa.Emp_id));
    if (!porRegistro?.size) continue;
    const lineas = formatearLineas(porRegistro);
    if (lineas.length) grupos.push({ empresa: empresa.Emp_nombre, lineas });
  }

  if (grupos.length === 0) {
    console.log('Consolidado global sin incidencias. No se envía correo.');
    return;
  }

  const total = grupos.reduce((acumulado, grupo) => acumulado + grupo.lineas.length, 0);
  const html = construirHtml(grupos);
  try {
    await enviarCorreo(adminsGlobales.join(','), 'DOCUMENTOS FALTANTES', html);
    console.log('[OK] Consolidado enviado a ' + adminsGlobales.length + ' admin(s) global(es) (' + total + ' unidades/registros con faltantes).');
  } catch (err) {
    console.error('[FAIL] No se pudo enviar consolidado global:', err.message);
  }
}

async function monitorearDocumentos() {
  const inicio = Date.now();
  console.log('=== Monitoreo de documentos: inicio ===');
  try {
    cacheEmpresas = null;
    const empresas = await obtenerEmpresas();
    const { adminsPorEmpresa, adminsGlobales } = await obtenerDestinatarios();
    const incidenciasPorEmpresa = await recolectarTodasLasIncidencias();
    await reportarPorEmpresa(incidenciasPorEmpresa, adminsPorEmpresa, empresas);
    await reportarConsolidadoGlobal(incidenciasPorEmpresa, adminsGlobales, empresas);
    console.log('=== Monitoreo de documentos: fin (' + (Date.now() - inicio) + ' ms) ===');
  } catch (error) {
    console.error('Error crítico durante el monitoreo de documentos:', error);
  }
}

cron.schedule('0 8 * * 1', monitorearDocumentos, {
  timezone: 'America/Mexico_City',
});

module.exports = monitorearDocumentos;
