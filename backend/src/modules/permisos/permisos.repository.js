const db = require('../../config/database');

class PermisosRepository {
  async findAll(filters = {}) {
    const { limit, offset } = filters;
    let sql = 'SELECT * FROM Permisos';
    const params = [];
    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async count(filters = {}) {
    const [rows] = await db.query('SELECT COUNT(*) AS total FROM Permisos');
    return rows[0].total;
  }

  async findById(id, connection = null) {
    const dbConn = connection || db;
    const [rows] = await dbConn.query('SELECT * FROM Permisos WHERE PerM_id = ?', [id]);
    return rows[0] || null;
  }

  async create(data, connection = null) {
    const dbConn = connection || db;
    const [result] = await dbConn.query('INSERT INTO Permisos SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data, connection = null) {
    const dbConn = connection || db;
    await dbConn.query('UPDATE Permisos SET ? WHERE PerM_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id, connection = null) {
    const dbConn = connection || db;
    const [result] = await dbConn.query('DELETE FROM Permisos WHERE PerM_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new PermisosRepository();