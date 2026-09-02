const db = require('../config/database');

/**
 * Registra una acción en la tabla Movimientos.
 * @param {string} tabla - Nombre de la tabla afectada.
 * @param {string|number} registroId - ID del registro afectado.
 * @param {string} accion - 'INSERT', 'UPDATE', 'DELETE'.
 * @param {object} detalles - Objeto con detalles del cambio.
 * @param {number|null} usuarioId - ID del usuario que realizó la acción.
 */
async function registrarMovimiento(tabla, registroId, accion, detalles = {}, usuarioId = null) {
  try {
    // Obtener el ID de la acción según el nombre
    const [accionRows] = await db.query(
      'SELECT AcM_id FROM Acciones_movimiento WHERE AcM_nombre = ?',
      [accion]
    );
    if (accionRows.length === 0) {
      console.warn(`Acción ${accion} no encontrada en Acciones_movimiento`);
      return;
    }
    const accionId = accionRows[0].AcM_id;

    await db.query(
      `INSERT INTO Movimientos 
       (Mov_tabla_afectada, Mov_registro_afectado, Mov_accion, Mov_detalles, Mov_usu_id)
       VALUES (?, ?, ?, ?, ?)`,
      [tabla, registroId.toString(), accionId, JSON.stringify(detalles), usuarioId]
    );
  } catch (err) {
    console.error('Error al registrar auditoría:', err);
  }
}

module.exports = { registrarMovimiento };