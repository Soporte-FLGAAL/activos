const db = require('../../config/database');

class AuditoriaRepository {
  async findAll(filters = {}) {
    const { tabla, accionId, usuarioId, fechaInicio, fechaFin } = filters;
    let sql = `
      SELECT m.*, a.AcM_nombre AS accion_nombre, u.Usu_correo AS usuario_email
      FROM Movimientos m
      JOIN Acciones_movimiento a ON m.Mov_accion = a.AcM_id
      LEFT JOIN Usuario u ON m.Mov_usu_id = u.Usu_id
      WHERE 1=1
    `;
    const params = [];
    if (tabla) {
      sql += ' AND m.Mov_tabla_afectada = ?';
      params.push(tabla);
    }
    if (accionId) {
      sql += ' AND m.Mov_accion = ?';
      params.push(accionId);
    }
    if (usuarioId) {
      sql += ' AND m.Mov_usu_id = ?';
      params.push(usuarioId);
    }
    if (fechaInicio) {
      sql += ' AND m.Mov_fecha >= ?';
      params.push(fechaInicio);
    }
    if (fechaFin) {
      sql += ' AND m.Mov_fecha <= ?';
      params.push(fechaFin);
    }
    sql += ' ORDER BY m.Mov_fecha DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await db.query(
      `SELECT m.*, a.AcM_nombre AS accion_nombre, u.Usu_correo AS usuario_email
       FROM Movimientos m
       JOIN Acciones_movimiento a ON m.Mov_accion = a.AcM_id
       LEFT JOIN Usuario u ON m.Mov_usu_id = u.Usu_id
       WHERE m.Mov_id = ?`,
      [id]
    );
    return rows[0] || null;
  }
}

module.exports = new AuditoriaRepository();