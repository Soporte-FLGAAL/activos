const db = require('../../config/database');

class CotejosRepository {
  async findAll(filters = {}) {
    const { tarjetaId, empresaId, limit, offset } = filters;
    let sql = `
      SELECT c.*, tc.TC_tarjeta, u.Uni_empresa_actual
      FROM Cotejos c
      JOIN Tarjeta_circulacion tc ON c.Cot_tarjeta_id = tc.TC_id
      JOIN Unidades u ON tc.TC_unidad_id = u.Uni_id
      WHERE 1=1
    `;
    const params = [];
    if (empresaId) { sql += ' AND u.Uni_empresa_actual = ?'; params.push(empresaId); }
    if (tarjetaId) { sql += ' AND c.Cot_tarjeta_id = ?'; params.push(tarjetaId); }
    sql += ' ORDER BY c.Cot_id DESC';
    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async count(filters = {}) {
    const { tarjetaId, empresaId } = filters;
    let sql = `
      SELECT COUNT(*) AS total
      FROM Cotejos c
      JOIN Tarjeta_circulacion tc ON c.Cot_tarjeta_id = tc.TC_id
      JOIN Unidades u ON tc.TC_unidad_id = u.Uni_id
      WHERE 1=1
    `;
    const params = [];
    if (empresaId) { sql += ' AND u.Uni_empresa_actual = ?'; params.push(empresaId); }
    if (tarjetaId) { sql += ' AND c.Cot_tarjeta_id = ?'; params.push(tarjetaId); }
    const [rows] = await db.query(sql, params);
    return rows[0].total;
  }

  async findById(id, empresaId = null) {
    let sql = `
      SELECT c.*, tc.TC_tarjeta, u.Uni_empresa_actual
      FROM Cotejos c
      JOIN Tarjeta_circulacion tc ON c.Cot_tarjeta_id = tc.TC_id
      JOIN Unidades u ON tc.TC_unidad_id = u.Uni_id
      WHERE c.Cot_id = ?
    `;
    const params = [id];
    if (empresaId) { sql += ' AND u.Uni_empresa_actual = ?'; params.push(empresaId); }
    const [rows] = await db.query(sql, params);
    return rows[0] || null;
  }

  async create(data, connection = null) {
    const dbConn = connection || db;
    const [result] = await dbConn.query('INSERT INTO Cotejos SET ?', data);
    return result.insertId;
  }

  async update(id, data, empresaId = null, connection = null) {
    const dbConn = connection || db;
    let sql = 'UPDATE Cotejos SET ? WHERE Cot_id = ?';
    const params = [data, id];
    if (empresaId) {
      sql += ` AND Cot_tarjeta_id IN (
        SELECT tc.TC_id FROM Tarjeta_circulacion tc
        JOIN Unidades u ON tc.TC_unidad_id = u.Uni_id
        WHERE u.Uni_empresa_actual = ?
      )`;
      params.push(empresaId);
    }
    const [result] = await dbConn.query(sql, params);
    return result.affectedRows > 0;
  }

  async delete(id, empresaId = null, connection = null) {
    const dbConn = connection || db;
    let sql = 'DELETE FROM Cotejos WHERE Cot_id = ?';
    const params = [id];
    if (empresaId) {
      sql += ` AND Cot_tarjeta_id IN (
        SELECT tc.TC_id FROM Tarjeta_circulacion tc
        JOIN Unidades u ON tc.TC_unidad_id = u.Uni_id
        WHERE u.Uni_empresa_actual = ?
      )`;
      params.push(empresaId);
    }
    const [result] = await dbConn.query(sql, params);
    return result.affectedRows > 0;
  }
}

module.exports = new CotejosRepository();