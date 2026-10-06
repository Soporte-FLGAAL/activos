const db = require('../../config/database');

class DetallePlacasRepository {
  async findAll(filters = {}) {
    const { placasId, limit, offset } = filters;
    let sql = `
      SELECT dp.*, p.Pla_placas, tm.TpMP_nombre AS tipo_movimiento_nombre
      FROM Detalle_placas dp
      JOIN Placas p ON dp.DP_placas_id = p.Pla_id
      JOIN Tipo_movimiento_placa tm ON dp.DP_tipo_movimiento = tm.TpMP_id
      WHERE 1=1
    `;
    const params = [];
    if (placasId) {
      sql += ' AND dp.DP_placas_id = ?';
      params.push(placasId);
    }
    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async count(filters = {}) {
    const { placasId } = filters;
    let sql = 'SELECT COUNT(*) AS total FROM Detalle_placas dp WHERE 1=1';
    const params = [];
    if (placasId) {
      sql += ' AND dp.DP_placas_id = ?';
      params.push(placasId);
    }
    const [rows] = await db.query(sql, params);
    return rows[0].total;
  }

  async findById(id) {
    const [rows] = await db.query(
      `SELECT dp.*, p.Pla_placas, tm.TpMP_nombre AS tipo_movimiento_nombre
       FROM Detalle_placas dp
       JOIN Placas p ON dp.DP_placas_id = p.Pla_id
       JOIN Tipo_movimiento_placa tm ON dp.DP_tipo_movimiento = tm.TpMP_id
       WHERE dp.DP_id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Detalle_placas SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await db.query('UPDATE Detalle_placas SET ? WHERE DP_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM Detalle_placas WHERE DP_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new DetallePlacasRepository();