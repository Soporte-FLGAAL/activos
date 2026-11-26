const db = require('../../config/database');

class EndososRepository {
  async findAll(filters = {}) {
    const { polizaId, empresaId, limit, offset } = filters;
    let sql = `
      SELECT e.*, p.Pol_poliza, u.Uni_empresa_actual
      FROM Endoso e
      JOIN Polizas p ON e.End_poliza = p.Pol_id
      JOIN Unidades u ON p.Pol_unidad_id = u.Uni_id
      WHERE 1=1
    `;
    const params = [];
    if (empresaId) {
      sql += ' AND (u.Uni_empresa_actual = ? OR u.Uni_propietario = ?)';
      params.push(empresaId, empresaId);
    }
    if (polizaId) {
      sql += ' AND e.End_poliza = ?';
      params.push(polizaId);
    }
    sql += ' ORDER BY e.End_id DESC';
    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async count(filters = {}) {
    const { polizaId, empresaId } = filters;
    let sql = `
      SELECT COUNT(*) AS total
      FROM Endoso e
      JOIN Polizas p ON e.End_poliza = p.Pol_id
      JOIN Unidades u ON p.Pol_unidad_id = u.Uni_id
      WHERE 1=1
    `;
    const params = [];
    if (empresaId) {
      sql += ' AND (u.Uni_empresa_actual = ? OR u.Uni_propietario = ?)';
      params.push(empresaId, empresaId);
    }
    if (polizaId) {
      sql += ' AND e.End_poliza = ?';
      params.push(polizaId);
    }
    const [rows] = await db.query(sql, params);
    return rows[0].total;
  }

  async findById(id, empresaId = null) {
    let sql = `
      SELECT e.*, p.Pol_poliza, u.Uni_empresa_actual
      FROM Endoso e
      JOIN Polizas p ON e.End_poliza = p.Pol_id
      JOIN Unidades u ON p.Pol_unidad_id = u.Uni_id
      WHERE e.End_id = ?
    `;
    const params = [id];
    if (empresaId) {
      sql += ' AND (u.Uni_empresa_actual = ? OR u.Uni_propietario = ?)';
      params.push(empresaId, empresaId);
    }
    const [rows] = await db.query(sql, params);
    return rows[0] || null;
  }

  async create(data, connection = null) {
    const dbConn = connection || db;
    const [result] = await dbConn.query('INSERT INTO Endoso SET ?', data);
    return result.insertId;
  }

  async update(id, data, empresaId = null, connection = null) {
    const dbConn = connection || db;
    let sql = 'UPDATE Endoso SET ? WHERE End_id = ?';
    const params = [data, id];
    if (empresaId) {
      sql += ` AND End_poliza IN (
        SELECT p.Pol_id FROM Polizas p
        JOIN Unidades u ON p.Pol_unidad_id = u.Uni_id
        WHERE u.Uni_empresa_actual = ?
      )`;
      params.push(empresaId);
    }
    const [result] = await dbConn.query(sql, params);
    return result.affectedRows > 0;
  }

  async delete(id, empresaId = null, connection = null) {
    const dbConn = connection || db;
    let sql = 'DELETE FROM Endoso WHERE End_id = ?';
    const params = [id];
    if (empresaId) {
      sql += ` AND End_poliza IN (
        SELECT p.Pol_id FROM Polizas p
        JOIN Unidades u ON p.Pol_unidad_id = u.Uni_id
        WHERE u.Uni_empresa_actual = ?
      )`;
      params.push(empresaId);
    }
    const [result] = await dbConn.query(sql, params);
    return result.affectedRows > 0;
  }
}

module.exports = new EndososRepository();