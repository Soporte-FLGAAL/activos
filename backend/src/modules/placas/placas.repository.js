const db = require('../../config/database');

class PlacasRepository {
  async findAll(filters = {}) {
    const { empresaId, limit, offset } = filters;
    let sql = `
      SELECT p.*, e1.Emp_nombre AS propietario_nombre, e2.Emp_nombre AS empresa_nombre
      FROM Placas p
      LEFT JOIN Empresas e1 ON p.Pla_propietario = e1.Emp_id
      JOIN Empresas e2 ON p.Pla_empresa_actual = e2.Emp_id
      WHERE 1=1
    `;
    const params = [];

    if (empresaId) {
      sql += ' AND p.Pla_empresa_actual = ?';
      params.push(empresaId);
    }

    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }

    const [rows] = await db.query(sql, params);
    return rows;
  }

  async count(filters = {}) {
    const { empresaId } = filters;
    let sql = 'SELECT COUNT(*) AS total FROM Placas p WHERE 1=1';
    const params = [];

    if (empresaId) {
      sql += ' AND p.Pla_empresa_actual = ?';
      params.push(empresaId);
    }

    const [rows] = await db.query(sql, params);
    return rows[0].total;
  }

  async findById(id, empresaId = null, connection = null) {
    let sql = `
      SELECT p.*, e1.Emp_nombre AS propietario_nombre, e2.Emp_nombre AS empresa_nombre
      FROM Placas p
      LEFT JOIN Empresas e1 ON p.Pla_propietario = e1.Emp_id
      JOIN Empresas e2 ON p.Pla_empresa_actual = e2.Emp_id
      WHERE p.Pla_id = ?
    `;
    const params = [id];
    if (empresaId) {
      sql += ' AND p.Pla_empresa_actual = ?';
      params.push(empresaId);
    }
    const dbConn = connection || db;
    const [rows] = await dbConn.query(sql, params);
    return rows[0] || null;
  }

  async create(data, connection = null) {
    const dbConn = connection || db;
    const [result] = await dbConn.query('INSERT INTO Placas SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data, empresaId = null, connection = null) {
    const params = [data, id];
    let sql =
    `
    UPDATE Placas 
      SET ? 
      WHERE Pla_id = ?
    `
    if (empresaId) {
      sql += ' AND Pla_empresa_actual = ?';
      params.push(empresaId);
    }
    const dbConn = connection || db;
    await dbConn.query(sql, params);
    return this.findById(id, empresaId);
  }

  async delete(id, empresaId = null, connection = null) {
    const params = [id];
    let sql =
    `
    DELETE FROM Placas 
      WHERE Pla_id = ?
    `
    if (empresaId) {
      sql += ' AND Pla_empresa_actual = ?';
      params.push(empresaId);
    }
    const dbConn = connection || db;
    const [result] = await dbConn.query(sql, params);
    return result.affectedRows > 0;
  }
}

module.exports = new PlacasRepository();