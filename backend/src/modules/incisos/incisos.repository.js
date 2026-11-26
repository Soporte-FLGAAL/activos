const db = require('../../config/database');

class IncisosRepository {
  async findAll(filters = {}) {
    const { endosoId, empresaId, limit, offset } = filters;
    let sql = `
      SELECT i.*, e.End_endoso, u.Uni_empresa_actual
      FROM Inciso i
      JOIN Endoso e ON i.Inc_endoso = e.End_id
      JOIN Polizas p ON e.End_poliza = p.Pol_id
      JOIN Unidades u ON p.Pol_unidad_id = u.Uni_id
      WHERE 1=1
    `;
    const params = [];
    if (empresaId) {
      sql += ' AND (u.Uni_empresa_actual = ? OR u.Uni_propietario = ?)';
      params.push(empresaId, empresaId);
    }
    if (endosoId) {
      sql += ' AND i.Inc_endoso = ?';
      params.push(endosoId);
    }
    sql += ' ORDER BY i.Inc_id DESC';
    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async count(filters = {}) {
    const { endosoId, empresaId } = filters;
    let sql = `
      SELECT COUNT(*) AS total
      FROM Inciso i
      JOIN Endoso e ON i.Inc_endoso = e.End_id
      JOIN Polizas p ON e.End_poliza = p.Pol_id
      JOIN Unidades u ON p.Pol_unidad_id = u.Uni_id
      WHERE 1=1
    `;
    const params = [];
    if (empresaId) { sql += ' AND (u.Uni_empresa_actual = ? OR u.Uni_propietario = ?)'; params.push(empresaId, empresaId); }
    if (endosoId) { sql += ' AND i.Inc_endoso = ?'; params.push(endosoId); }
    const [rows] = await db.query(sql, params);
    return rows[0].total;
  }

  async findById(id, empresaId = null) {
    let sql = `
      SELECT i.*, e.End_endoso, u.Uni_empresa_actual
      FROM Inciso i
      JOIN Endoso e ON i.Inc_endoso = e.End_id
      JOIN Polizas p ON e.End_poliza = p.Pol_id
      JOIN Unidades u ON p.Pol_unidad_id = u.Uni_id
      WHERE i.Inc_id = ?
    `;
    const params = [id];
    if (empresaId) { sql += ' AND (u.Uni_empresa_actual = ? OR u.Uni_propietario = ?)'; params.push(empresaId, empresaId); }
    const [rows] = await db.query(sql, params);
    return rows[0] || null;
  }

  async create(data, connection = null) {
    const dbConn = connection || db;
    const [result] = await dbConn.query('INSERT INTO Inciso SET ?', data);
    return result.insertId;
  }

  async update(id, data, empresaId = null, connection = null) {
    const dbConn = connection || db;
    let sql = 'UPDATE Inciso SET ? WHERE Inc_id = ?';
    const params = [data, id];
    if (empresaId) {
      sql += ` AND Inc_endoso IN (
        SELECT e.End_id FROM Endoso e
        JOIN Polizas p ON e.End_poliza = p.Pol_id
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
    let sql = 'DELETE FROM Inciso WHERE Inc_id = ?';
    const params = [id];
    if (empresaId) {
      sql += ` AND Inc_endoso IN (
        SELECT e.End_id FROM Endoso e
        JOIN Polizas p ON e.End_poliza = p.Pol_id
        JOIN Unidades u ON p.Pol_unidad_id = u.Uni_id
        WHERE u.Uni_empresa_actual = ?
      )`;
      params.push(empresaId);
    }
    const [result] = await dbConn.query(sql, params);
    return result.affectedRows > 0;
  }
}

module.exports = new IncisosRepository();