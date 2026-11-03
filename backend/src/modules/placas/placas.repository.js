const db = require('../../config/database');

class PlacasRepository {
  _buildFilters(filters = {}) {
    const { empresaId, status, search } = filters;
    let where = ' WHERE 1=1';
    const params = [];

    if (empresaId) {
      where += ' AND p.Pla_empresa_actual = ?';
      params.push(empresaId);
    }
    if (status) {
      where += ' AND p.Pla_status = ?';
      params.push(status);
    }
    if (search) {
      where += ' AND (p.Pla_placas LIKE ? OR e1.Emp_nombre LIKE ? OR e2.Emp_nombre LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    return { where, params };
  }

  async findAll(filters = {}) {
    const { limit, offset } = filters;
    const { where, params } = this._buildFilters(filters);
    let sql = `
      SELECT p.*, e1.Emp_nombre AS propietario_nombre, e2.Emp_nombre AS empresa_nombre
      FROM Placas p
      LEFT JOIN Empresas e1 ON p.Pla_propietario = e1.Emp_id
      JOIN Empresas e2 ON p.Pla_empresa_actual = e2.Emp_id
      ${where}
      ORDER BY p.Pla_id DESC
    `;
    const queryParams = [...params];
    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);
    }
    const [rows] = await db.query(sql, queryParams);
    return rows;
  }

  async count(filters = {}) {
    const { where, params } = this._buildFilters(filters);
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM Placas p
       LEFT JOIN Empresas e1 ON p.Pla_propietario = e1.Emp_id
       JOIN Empresas e2 ON p.Pla_empresa_actual = e2.Emp_id
       ${where}`,
      params
    );
    return rows[0].total;
  }

  async findById(id, empresaId = null, connection = null) {
    const dbConn = connection || db;
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
    const [rows] = await dbConn.query(sql, params);
    return rows[0] || null;
  }

  async create(data, connection = null) {
    const dbConn = connection || db;
    const [result] = await dbConn.query('INSERT INTO Placas SET ?', data);
    return result.insertId;
  }

  async update(id, data, empresaId = null, connection = null) {
    const params = [data, id];
    let sql = 'UPDATE Placas SET ? WHERE Pla_id = ?';
    if (empresaId) {
      sql += ' AND Pla_empresa_actual = ?';
      params.push(empresaId);
    }
    const dbConn = connection || db;
    const [result] = await dbConn.query(sql, params);
    return result.affectedRows > 0;
  }

  async delete(id, empresaId = null, connection = null) {
    const params = [id];
    let sql = 'DELETE FROM Placas WHERE Pla_id = ?';
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
