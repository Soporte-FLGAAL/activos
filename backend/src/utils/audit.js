const db = require('../config/database');

async function registrarMovimiento(tabla, registroId, accion, detalles = {}, usuarioId = null, connection = null) {
  const dbConn = connection || db; // Usa la conexión de transacción si se proporciona
  try {
    const [accionRows] = await dbConn.query(
      'SELECT AcM_id FROM Acciones_movimiento WHERE AcM_nombre = ?',
      [accion]
    );
    if (accionRows.length === 0) {
      console.warn(`Acción ${accion} no encontrada en Acciones_movimiento`);
      return;
    }
    const accionId = accionRows[0].AcM_id;

    await dbConn.query(
      `INSERT INTO Movimientos 
       (Mov_tabla_afectada, Mov_registro_afectado, Mov_accion, Mov_detalles, Mov_usu_id)
       VALUES (?, ?, ?, ?, ?)`,
      [tabla, registroId.toString(), accionId, JSON.stringify(detalles), usuarioId]
    );
  } catch (err) {
    console.error('Error al registrar auditoría:', err);
    throw err; // Relanza para que la transacción haga rollback si falla
  }
}

module.exports = { registrarMovimiento };