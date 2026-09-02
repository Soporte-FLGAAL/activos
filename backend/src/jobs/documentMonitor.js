const cron = require('node-cron');
const db = require('../config/database');
const { enviarCorreo } = require('../services/email.service');

// Definición de las tablas y campos URL a monitorear
const monitoreos = [
  {
    tabla: 'Unidades',
    query: `SELECT Uni_id, Uni_no_economico, Uni_factura_url, Uni_url_verificacion_mecanica, Uni_url_verificacion_contaminantes 
            FROM Unidades 
            WHERE Uni_factura_url IS NULL OR Uni_factura_url = '' 
               OR Uni_url_verificacion_mecanica IS NULL OR Uni_url_verificacion_mecanica = '' 
               OR Uni_url_verificacion_contaminantes IS NULL OR Uni_url_verificacion_contaminantes = ''`,
    campos: ['factura', 'verificación mecánica', 'verificación contaminantes'],
  },
  {
    tabla: 'Polizas',
    query: `SELECT Pol_id, Pol_poliza, Pol_url FROM Polizas WHERE Pol_url IS NULL OR Pol_url = ''`,
    campos: ['URL de póliza'],
  },
  {
    tabla: 'Endosos',
    query: `SELECT End_id, End_endoso, End_url FROM Endoso WHERE End_url IS NULL OR End_url = ''`,
    campos: ['URL de endoso'],
  },
  {
    tabla: 'Incisos',
    query: `SELECT Inc_id, Inc_inciso, Inc_url FROM Inciso WHERE Inc_url IS NULL OR Inc_url = ''`,
    campos: ['URL de inciso'],
  },
  {
    tabla: 'Detalle_placas',
    query: `SELECT DP_id, DP_url FROM Detalle_placas WHERE DP_url IS NULL OR DP_url = ''`,
    campos: ['URL de detalle de placa'],
  },
  {
    tabla: 'Tarjeta_circulacion',
    query: `SELECT TC_id, TC_tarjeta, TC_url FROM Tarjeta_circulacion WHERE TC_url IS NULL OR TC_url = ''`,
    campos: ['URL de tarjeta'],
  },
  {
    tabla: 'Doble_articulado',
    query: `SELECT PDA_id, PDA_permiso, PDA_url FROM Doble_articulado WHERE PDA_url IS NULL OR PDA_url = ''`,
    campos: ['URL de permiso'],
  },
  {
    tabla: 'SICT',
    query: `SELECT SICT_id, SICT_permiso, SICT_url FROM SICT WHERE SICT_url IS NULL OR SICT_url = ''`,
    campos: ['URL de permiso SICT'],
  },
];

async function obtenerDestinatarios() {
  const [admins] = await db.query(`
    SELECT DISTINCT u.Usu_correo
    FROM Usuario u
    JOIN Usuario_Empresas ue ON u.Usu_id = ue.UE_usuario
    JOIN Roles r ON ue.UE_rol = r.Rol_id
    WHERE r.Rol_nombre = 'ADMIN'
  `);
  return admins.map(a => a.Usu_correo);
}

async function monitorearDocumentos() {
  try {
    console.log('Ejecutando monitoreo de documentos...');
    const destinatarios = await obtenerDestinatarios();
    if (destinatarios.length === 0) {
      console.warn('No hay administradores definidos para enviar notificaciones.');
      return;
    }

    let html = '<h2>Resumen semanal de documentos faltantes</h2>';
    let totalIncidencias = 0;

    for (const monitoreo of monitoreos) {
      const [registros] = await db.query(monitoreo.query);
      if (registros.length === 0) continue;

      totalIncidencias += registros.length;
      html += `<h3>Tabla: ${monitoreo.tabla} (${registros.length} registros)</h3>`;
      html += '<ul>';
      for (const registro of registros) {
        let detalle = '';
        if (monitoreo.tabla === 'Unidades') {
          const faltantes = [];
          if (!registro.Uni_factura_url) faltantes.push('factura');
          if (!registro.Uni_url_verificacion_mecanica) faltantes.push('verificación mecánica');
          if (!registro.Uni_url_verificacion_contaminantes) faltantes.push('verificación contaminantes');
          detalle = `Unidad ${registro.Uni_no_economico} (ID: ${registro.Uni_id}) - faltantes: ${faltantes.join(', ')}`;
        } else if (monitoreo.tabla === 'Polizas') {
          detalle = `Póliza ${registro.Pol_poliza} (ID: ${registro.Pol_id})`;
        } else if (monitoreo.tabla === 'Endosos') {
          detalle = `Endoso ${registro.End_endoso} (ID: ${registro.End_id})`;
        } else if (monitoreo.tabla === 'Incisos') {
          detalle = `Inciso ${registro.Inc_inciso} (ID: ${registro.Inc_id})`;
        } else if (monitoreo.tabla === 'Detalle_placas') {
          detalle = `Detalle placa (ID: ${registro.DP_id})`;
        } else if (monitoreo.tabla === 'Tarjeta_circulacion') {
          detalle = `Tarjeta ${registro.TC_tarjeta} (ID: ${registro.TC_id})`;
        } else if (monitoreo.tabla === 'Doble_articulado') {
          detalle = `Permiso ${registro.PDA_permiso} (ID: ${registro.PDA_id})`;
        } else if (monitoreo.tabla === 'SICT') {
          detalle = `Permiso SICT ${registro.SICT_permiso} (ID: ${registro.SICT_id})`;
        }
        html += `<li>${detalle}</li>`;
      }
      html += '</ul>';
    }

    if (totalIncidencias === 0) {
      html = '<p>No hay documentos faltantes esta semana.</p>';
    }

    const asunto = `Documentos faltantes - ${new Date().toLocaleDateString()}`;
    await enviarCorreo(destinatarios.join(','), asunto, html);
    console.log(`Correo enviado a ${destinatarios.join(', ')} con ${totalIncidencias} incidencias.`);
  } catch (error) {
    console.error('Error durante el monitoreo de documentos:', error);
  }
}

// Programar para todos los lunes a las 8:00 AM (zona horaria de Ciudad de México)
cron.schedule('0 8 * * 1', monitorearDocumentos, {
  timezone: 'America/Mexico_City',
});

module.exports = monitorearDocumentos;