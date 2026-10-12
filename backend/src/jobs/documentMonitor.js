const cron = require('node-cron');
const db = require('../config/database');
const { enviarCorreo } = require('../services/email.service');

const ROL_ADMIN_GLOBAL = 'ADMIN_GLOBAL';
const ROL_ADMIN = 'ADMIN';

// Límite de envíos concurrentes (evita saturar SMTP)
const CONCURRENCIA_ENVIOS = 5;

// Cache de empresas durante la ejecución del job
let cacheEmpresas = null;

/**
 * Definición de monitoreos.
 * Cada query devuelve AL MENOS: empresa_id, id, referencia.
 * Sin filtro por empresa: se ejecuta una sola vez para todas.
 */
const MONITOREOS = [
  {
    tabla: 'Unidades',
    query: `
      SELECT u.Uni_empresa_actual AS empresa_id,
             u.Uni_id AS id, u.Uni_no_economico AS referencia,
             u.Uni_factura_url, u.Uni_url_verificacion_mecanica, u.Uni_url_verificacion_contaminantes
      FROM Unidades u
      WHERE u.Uni_factura_url IS NULL OR u.Uni_factura_url = ''
         OR u.Uni_url_verificacion_mecanica IS NULL OR u.Uni_url_verificacion_mecanica = ''
         OR u.Uni_url_verificacion_contaminantes IS NULL OR u.Uni_url_verificacion_contaminantes = ''`,
    describir: (r) => {
      const faltantes = [];
      if (!r.Uni_factura_url) faltantes.push('factura');
      if (!r.Uni_url_verificacion_mecanica) faltantes.push('verificación mecánica');
      if (!r.Uni_url_verificacion_contaminantes) faltantes.push('verificación contaminantes');
      return `Unidad ${r.referencia} (ID: ${r.id}) → faltan: ${faltantes.join(', ')}`;
    },
  },
  {
    tabla: 'Polizas',
    query: `
      SELECT u.Uni_empresa_actual AS empresa_id,
             p.Pol_id AS id, p.Pol_poliza AS referencia
      FROM Polizas p
      JOIN Unidades u ON p.Pol_unidad_id = u.Uni_id
      WHERE p.Pol_url IS NULL OR p.Pol_url = ''`,
    describir: (r) => `Póliza ${r.referencia} (ID: ${r.id})`,
  },
  {
    tabla: 'Endoso',
    query: `
      SELECT u.Uni_empresa_actual AS empresa_id,
             e.End_id AS id, e.End_endoso AS referencia
      FROM Endoso e
      JOIN Polizas p ON e.End_poliza = p.Pol_id
      JOIN Unidades u ON p.Pol_unidad_id = u.Uni_id
      WHERE e.End_url IS NULL OR e.End_url = ''`,
    describir: (r) => `Endoso ${r.referencia} (ID: ${r.id})`,
  },
  {
    tabla: 'Inciso',
    query: `
      SELECT u.Uni_empresa_actual AS empresa_id,
             i.Inc_id AS id, i.Inc_inciso AS referencia
      FROM Inciso i
      JOIN Endoso e ON i.Inc_endoso = e.End_id
      JOIN Polizas p ON e.End_poliza = p.Pol_id
      JOIN Unidades u ON p.Pol_unidad_id = u.Uni_id
      WHERE i.Inc_url IS NULL OR i.Inc_url = ''`,
    describir: (r) => `Inciso ${r.referencia} (ID: ${r.id})`,
  },
  {
    tabla: 'Detalle_placas',
    query: `
      SELECT p.Pla_empresa_actual AS empresa_id,
             dp.DP_id AS id, p.Pla_placas AS referencia
      FROM Detalle_placas dp
      JOIN Placas p ON dp.DP_placas_id = p.Pla_id
      WHERE dp.DP_url IS NULL OR dp.DP_url = ''`,
    describir: (r) => `Detalle de placa ${r.referencia} (ID: ${r.id})`,
  },
  {
    tabla: 'Tarjeta_circulacion',
    query: `
      SELECT u.Uni_empresa_actual AS empresa_id,
             tc.TC_id AS id, tc.TC_tarjeta AS referencia
      FROM Tarjeta_circulacion tc
      JOIN Unidades u ON tc.TC_unidad_id = u.Uni_id
      WHERE tc.TC_url IS NULL OR tc.TC_url = ''`,
    describir: (r) => `Tarjeta ${r.referencia} (ID: ${r.id})`,
  },
  {
    tabla: 'Doble_articulado',
    query: `
      SELECT u.Uni_empresa_actual AS empresa_id,
             pda.PDA_id AS id, pda.PDA_permiso AS referencia
      FROM Doble_articulado pda
      JOIN Unidades u ON pda.PDA_unidad_id = u.Uni_id
      WHERE pda.PDA_url IS NULL OR pda.PDA_url = ''`,
    describir: (r) => `Permiso doble articulado ${r.referencia} (ID: ${r.id})`,
  },
  {
    tabla: 'SICT',
    query: `
      SELECT u.Uni_empresa_actual AS empresa_id,
             s.SICT_id AS id, s.SICT_permiso AS referencia
      FROM SICT s
      JOIN Unidades u ON s.SICT_unidad_id = u.Uni_id
      WHERE s.SICT_url IS NULL OR s.SICT_url = ''`,
    describir: (r) => `Permiso SICT ${r.referencia} (ID: ${r.id})`,
  },
];

/* ============================
 *   UTILIDADES
 * ============================ */

async function obtenerEmpresas() {
  if (cacheEmpresas) return cacheEmpresas;
  const [rows] = await db.query('SELECT Emp_id, Emp_nombre FROM Empresas');
  cacheEmpresas = rows;
  return cacheEmpresas;
}

/**
 * Devuelve un Map<empresaId, Map<tabla, string[]>>
 * con todas las incidencias agrupadas.
 * Ejecuta 8 queries (una por tabla) sin filtrar por empresa.
 */
async function recolectarTodasLasIncidencias() {
  // estructura: { [empresaId]: { [tabla]: [descripciones] } }
  const agrupado = new Map();

  for (const m of MONITOREOS) {
    const [registros] = await db.query(m.query);
    for (const r of registros) {
      const emp = r.empresa_id;
      if (!agrupado.has(emp)) agrupado.set(emp, new Map());
      const porTabla = agrupado.get(emp);
      if (!porTabla.has(m.tabla)) porTabla.set(m.tabla, []);
      porTabla.get(m.tabla).push(m.describir(r));
    }
  }

  return agrupado;
}

/**
 * Obtiene un Map<empresaId, correos[]>
 * de ADMIN por empresa, y el array de ADMIN_GLOBAL.
 */
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
    if (!mapaPorEmpresa.has(row.empresa_id)) mapaPorEmpresa.set(row.empresa_id, []);
    mapaPorEmpresa.get(row.empresa_id).push(row.Usu_correo);
  }

  return {
    adminsPorEmpresa: mapaPorEmpresa,
    adminsGlobales: adminsGlobales.map(r => r.Usu_correo),
  };
}

/**
 * Construye HTML a partir de bloques { tabla, incidencias: [] }.
 */
function construirHtml(bloques, titulo) {
  let html = `<h2>${titulo}</h2>`;
  const total = bloques.reduce((acc, b) => acc + b.incidencias.length, 0);

  if (total === 0) {
    return `${html}<p>No hay documentos faltantes esta semana.</p>`;
  }

  html += `<p><strong>Total de incidencias: ${total}</strong></p>`;
  for (const bloque of bloques) {
    html += `<h3>Tabla: ${bloque.tabla} (${bloque.incidencias.length})</h3><ul>`;
    for (const inc of bloque.incidencias) {
      html += `<li>${inc}</li>`;
    }
    html += '</ul>';
  }
  return html;
}

/**
 * Ejecuta promesas con un límite de concurrencia.
 */
async function conLimite(items, limite, fn) {
  const resultados = [];
  let indice = 0;

  async function worker() {
    while (indice < items.length) {
      const i = indice++;
      try {
        await fn(items[i], i);
      } catch (err) {
        console.error(`[worker] Error procesando item ${i}:`, err.message);
      }
    }
  }

  const workers = Array.from({ length: Math.min(limite, items.length) }, worker);
  await Promise.all(workers);
  return resultados;
}

/* ============================
 *   FLUJOS DE REPORTE
 * ============================ */

/**
 * Envía los reportes por empresa. Cada envío está aislado.
 * Solo se envían correos si hay incidencias.
 */
async function reportarPorEmpresa(incidenciasPorEmpresa, adminsPorEmpresa, empresas) {
  const fecha = new Date().toLocaleDateString();

  // Preparar lista de tareas (solo empresas con admins e incidencias)
  const tareas = [];
  for (const empresa of empresas) {
    const admins = adminsPorEmpresa.get(empresa.Emp_id);
    if (!admins || admins.length === 0) continue;

    const porTabla = incidenciasPorEmpresa.get(empresa.Emp_id);
    if (!porTabla) continue;

    const bloques = Array.from(porTabla.entries()).map(([tabla, incidencias]) => ({
      tabla,
      incidencias,
    }));
    const total = bloques.reduce((acc, b) => acc + b.incidencias.length, 0);
    if (total === 0) continue;

    tareas.push({ empresa, admins, bloques, total });
  }

  // Enviar con concurrencia controlada
  await conLimite(tareas, CONCURRENCIA_ENVIOS, async ({ empresa, admins, bloques, total }) => {
    const html = construirHtml(bloques, `Documentos faltantes — ${empresa.Emp_nombre}`);
    const asunto = `Documentos faltantes ${empresa.Emp_nombre} — ${fecha}`;
    try {
      await enviarCorreo(admins.join(','), asunto, html);
      console.log(`[OK] Reporte enviado a ${admins.length} admin(s) de ${empresa.Emp_nombre} (${total} incidencias).`);
    } catch (err) {
      console.error(`[FAIL] No se pudo enviar reporte de ${empresa.Emp_nombre}:`, err.message);
    }
  });
}

/**
 * Envía el consolidado a ADMIN_GLOBAL.
 */
async function reportarConsolidadoGlobal(incidenciasPorEmpresa, adminsGlobales, empresas) {
  if (adminsGlobales.length === 0) return;

  const fecha = new Date().toLocaleDateString();
  const bloquesGlobales = [];

  for (const empresa of empresas) {
    const porTabla = incidenciasPorEmpresa.get(empresa.Emp_id);
    if (!porTabla) continue;

    const incidencias = [];
    for (const [tabla, lista] of porTabla.entries()) {
      for (const inc of lista) {
        incidencias.push(`[${tabla}] ${inc}`);
      }
    }
    if (incidencias.length === 0) continue;

    bloquesGlobales.push({
      tabla: `Empresa: ${empresa.Emp_nombre}`,
      incidencias,
    });
  }

  const totalGlobal = bloquesGlobales.reduce((acc, b) => acc + b.incidencias.length, 0);
  if (totalGlobal === 0) {
    console.log('Consolidado global sin incidencias. No se envía correo.');
    return;
  }

  const html = construirHtml(bloquesGlobales, 'Consolidado global de documentos faltantes');
  const asunto = `Consolidado global documentos faltantes — ${fecha}`;

  try {
    await enviarCorreo(adminsGlobales.join(','), asunto, html);
    console.log(`[OK] Consolidado enviado a ${adminsGlobales.length} admin(s) global(es) (${totalGlobal} incidencias).`);
  } catch (err) {
    console.error('[FAIL] No se pudo enviar consolidado global:', err.message);
  }
}

/* ============================
 *   JOB PRINCIPAL
 * ============================ */

async function monitorearDocumentos() {
  const inicio = Date.now();
  console.log('=== Monitoreo de documentos: inicio ===');

  try {
    // Resetear cache por si el job corre varias veces en el mismo proceso
    cacheEmpresas = null;

    // 1. Datos base
    const empresas = await obtenerEmpresas();
    const { adminsPorEmpresa, adminsGlobales } = await obtenerDestinatarios();

    // 2. Recolectar incidencias en 8 queries agregadas (sin filtro por empresa)
    const incidenciasPorEmpresa = await recolectarTodasLasIncidencias();

    // 3. Enviar reportes
    await reportarPorEmpresa(incidenciasPorEmpresa, adminsPorEmpresa, empresas);
    await reportarConsolidadoGlobal(incidenciasPorEmpresa, adminsGlobales, empresas);

    const ms = Date.now() - inicio;
    console.log(`=== Monitoreo de documentos: fin (${ms} ms) ===`);
  } catch (error) {
    console.error('Error crítico durante el monitoreo de documentos:', error);
  }
}

// Ejecutar cada lunes a las 8:00 AM (hora CDMX)
cron.schedule('0 8 * * 1', monitorearDocumentos, {
  timezone: 'America/Mexico_City',
});

module.exports = monitorearDocumentos;