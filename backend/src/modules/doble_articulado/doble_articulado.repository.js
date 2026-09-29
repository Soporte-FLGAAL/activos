const db = require('../../config/database');

class DobleArticuladoRepository {
  async findAll(filters = {}) {
    const { unidadId, empresaId, limit, offset } = filters;
    let sql = `
      SELECT pda.*, u.Uni_no_economico, u.Uni_empresa_actual
      FROM Doble_articulado pda
      JOIN Unidades u ON pda.PDA_unidad_id = u.Uni_id
      WHERE 1=1
    `;
    const params = [];
    if (empresaId) { sql += ' AND u.Uni_empresa_actual = ?'; params.push(empresaId); }
    if (unidadId) { sql += ' AND pda.PDA_unidad_id = ?'; params.push(unidadId); }
    sql += ' ORDER BY pda.PDA_id DESC';
    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async count(filters = {}) {
    const { unidadId, empresaId } = filters;
    let sql = `
      SELECT COUNT(*) AS total
      FROM Doble_articulado pda
      JOIN Unidades u ON pda.PDA_unidad_id = u.Uni_id
      WHERE 1=1
    `;
    const params = [];
    if (empresaId) { sql += ' AND u.Uni_empresa_actual = ?'; params.push(empresaId); }
    if (unidadId) { sql += ' AND pda.PDA_unidad_id = ?'; params.push(unidadId); }
    const [rows] = await db.query(sql, params);
    return rows[0].total;
  }

  async findById(id, empresaId = null) {
    let sql = `
      SELECT pda.*, u.Uni_no_economico, u.Uni_empresa_actual
      FROM Doble_articulado pda
      JOIN Unidades u ON pda.PDA_unidad_id = u.Uni_id
      WHERE pda.PDA_id = ?
    `;
    const params = [id];
    if (empresaId) { sql += ' AND u.Uni_empresa_actual = ?'; params.push(empresaId); }
    const [rows] = await db.query(sql, params);
    return rows[0] || null;
  }

  async create(data, connection = null) {
    const dbConn = connection || db;
    const [result] = await dbConn.query('INSERT INTO Doble_articulado SET ?', data);
    return result.insertId;
  }

  async update(id, data, empresaId = null, connection = null) {
    const dbConn = connection || db;
    let sql = 'UPDATE Doble_articulado SET ? WHERE PDA_id = ?';
    const params = [data, id];
    if (empresaId) {
      sql += ' AND PDA_unidad_id IN (SELECT Uni_id FROM Unidades WHERE Uni_empresa_actual = ?)';
      params.push(empresaId);
    }
    const [result] = await dbConn.query(sql, params);
    return result.affectedRows > 0;
  }

  async delete(id, empresaId = null, connection = null) {
    const dbConn = connection || db;
    let sql = 'DELETE FROM Doble_articulado WHERE PDA_id = ?';
    const params = [id];
    if (empresaId) {
      sql += ' AND PDA_unidad_id IN (SELECT Uni_id FROM Unidades WHERE Uni_empresa_actual = ?)';
      params.push(empresaId);
    }
    const [result] = await dbConn.query(sql, params);
    return result.affectedRows > 0;
  }
}

module.exports = new DobleArticuladoRepository();