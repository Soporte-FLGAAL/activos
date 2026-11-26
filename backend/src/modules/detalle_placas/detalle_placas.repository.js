const db = require('../../config/database');

class DetallePlacasRepository {
  async findAll(filters = {}) {
    const { placasId, empresaId, limit, offset } = filters;
    let sql = `
      SELECT dp.*, p.Pla_placas, p.Pla_empresa_actual,
             tm.TpMP_nombre AS tipo_movimiento_nombre
      FROM Detalle_placas dp
      JOIN Placas p ON dp.DP_placas_id = p.Pla_id
      JOIN Tipo_movimiento_placa tm ON dp.DP_tipo_movimiento = tm.TpMP_id
      WHERE 1=1
    `;
    const params = [];
    if (empresaId) {
      sql += ` AND (
        p.Pla_empresa_actual = ? OR EXISTS (
          SELECT 1
          FROM Tarjeta_circulacion tc
          INNER JOIN Unidades u ON u.Uni_id = tc.TC_unidad_id
          WHERE tc.TC_placas_id = p.Pla_id AND u.Uni_propietario = ?
        )
      )`;
      params.push(empresaId, empresaId);
    }
    if (placasId) { sql += ' AND dp.DP_placas_id = ?'; params.push(placasId); }
    sql += ' ORDER BY dp.DP_id DESC';
    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async count(filters = {}) {
    const { placasId, empresaId } = filters;
    let sql = `
      SELECT COUNT(*) AS total
      FROM Detalle_placas dp
      JOIN Placas p ON dp.DP_placas_id = p.Pla_id
      WHERE 1=1
    `;
    const params = [];
    if (empresaId) {
      sql += ` AND (
        p.Pla_empresa_actual = ? OR EXISTS (
          SELECT 1
          FROM Tarjeta_circulacion tc
          INNER JOIN Unidades u ON u.Uni_id = tc.TC_unidad_id
          WHERE tc.TC_placas_id = p.Pla_id AND u.Uni_propietario = ?
        )
      )`;
      params.push(empresaId, empresaId);
    }
    if (placasId) { sql += ' AND dp.DP_placas_id = ?'; params.push(placasId); }
    const [rows] = await db.query(sql, params);
    return rows[0].total;
  }

  async findById(id, empresaId = null, connection = null) {
    const dbConn = connection || db;
    let sql = `
      SELECT dp.*, p.Pla_placas, p.Pla_empresa_actual,
             tm.TpMP_nombre AS tipo_movimiento_nombre
      FROM Detalle_placas dp
      JOIN Placas p ON dp.DP_placas_id = p.Pla_id
      JOIN Tipo_movimiento_placa tm ON dp.DP_tipo_movimiento = tm.TpMP_id
      WHERE dp.DP_id = ?
    `;
    const params = [id];
    if (empresaId) {
      sql += ` AND (
        p.Pla_empresa_actual = ? OR EXISTS (
          SELECT 1
          FROM Tarjeta_circulacion tc
          INNER JOIN Unidades u ON u.Uni_id = tc.TC_unidad_id
          WHERE tc.TC_placas_id = p.Pla_id AND u.Uni_propietario = ?
        )
      )`;
      params.push(empresaId, empresaId);
    }
    const [rows] = await dbConn.query(sql, params);
    return rows[0] || null;
  }

  async create(data, connection = null) {
    const dbConn = connection || db;
    const [result] = await dbConn.query('INSERT INTO Detalle_placas SET ?', data);
    return result.insertId;
  }

  async update(id, data, empresaId = null, connection = null) {
    const dbConn = connection || db;
    let sql = 'UPDATE Detalle_placas SET ? WHERE DP_id = ?';
    const params = [data, id];
    if (empresaId) {
      sql += ' AND DP_placas_id IN (SELECT Pla_id FROM Placas WHERE Pla_empresa_actual = ?)';
      params.push(empresaId);
    }
    const [result] = await dbConn.query(sql, params);
    return result.affectedRows > 0;
  }

  async delete(id, empresaId = null, connection = null) {
    const dbConn = connection || db;
    let sql = 'DELETE FROM Detalle_placas WHERE DP_id = ?';
    const params = [id];
    if (empresaId) {
      sql += ' AND DP_placas_id IN (SELECT Pla_id FROM Placas WHERE Pla_empresa_actual = ?)';
      params.push(empresaId);
    }
    const [result] = await dbConn.query(sql, params);
    return result.affectedRows > 0;
  }
}

module.exports = new DetallePlacasRepository();