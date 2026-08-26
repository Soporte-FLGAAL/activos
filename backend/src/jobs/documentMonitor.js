const cron = require('node-cron');
const db = require('../config/database');

// Simulación de envío de correo (se puede reemplazar con nodemailer)
function enviarCorreo(destinatario, asunto, mensaje) {
  console.log(`[CORREO] Para: ${destinatario} | Asunto: ${asunto} | Mensaje: ${mensaje}`);
}

async function monitorearDocumentos() {
  try {
    console.log('Ejecutando monitoreo de documentos...');
    // 1. Unidades
    const [unidades] = await db.query(
      `SELECT u.Uni_id, u.Uni_no_economico, u.Uni_factura_url, u.Uni_url_verificacion_contaminantes, u.Uni_url_verificacion_mecanica
       FROM Unidades u
       WHERE u.Uni_factura_url IS NULL OR u.Uni_factura_url = '' OR u.Uni_url_verificacion_contaminantes IS NULL OR u.Uni_url_verificacion_contaminantes = '' OR u.Uni_url_verificacion_mecanica IS NULL OR u.Uni_url_verificacion_mecanica = ''`
    );
    // Enviar correo por cada unidad con campos faltantes (aquí simplificamos)
    for (const u of unidades) {
      const faltantes = [];
      if (!u.Uni_factura_url) faltantes.push('factura');
      if (!u.Uni_url_verificacion_contaminantes) faltantes.push('verificación contaminantes');
      if (!u.Uni_url_verificacion_mecanica) faltantes.push('verificación mecánica');
      if (faltantes.length > 0) {
        // Obtener correo del responsable (ej: usuario admin) - simplificado
        enviarCorreo('admin@empresa.com', 'Documentos faltantes en unidad', `Unidad ${u.Uni_no_economico} tiene faltantes: ${faltantes.join(', ')}`);
      }
    }

    // 2. Pólizas: URL vacía
    const [polizas] = await db.query(`SELECT Pol_id, Pol_poliza, Pol_url FROM Polizas WHERE Pol_url IS NULL OR Pol_url = ''`);
    for (const p of polizas) {
      enviarCorreo('admin@empresa.com', 'Póliza sin documento', `Póliza ${p.Pol_poliza} no tiene URL de documento.`);
    }

    // 3. Endosos, Incisos, Placas, Tarjetas, Permisos especiales, etc.
    // ... (similar)

    console.log('Monitoreo completado.');
  } catch (err) {
    console.error('Error en monitoreo:', err);
  }
}

// Programar cada lunes a las 8:00 AM
cron.schedule('0 8 * * 1', monitorearDocumentos, {
  timezone: 'America/Mexico_City',
});

module.exports = monitorearDocumentos;