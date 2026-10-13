const db = require('../../config/database');

class RolesRepository {
  async findAll(filters = {}) {
    const { limit, offset } = filters;
    let sql = 'SELECT * FROM Roles';
    const params = [];
    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async count(filters = {}) {
    const [rows] = await db.query('SELECT COUNT(*) AS total FROM Roles');
    return rows[0].total;
  }

  async findById(id, connection = null) {
    const dbConn = connection || db;
    const [rows] = await dbConn.query('SELECT * FROM Roles WHERE Rol_id = ?', [id]);
    return rows[0] || null;
  }

  async create(data, connection = null) {
    const dbConn = connection || db;
    const [result] = await dbConn.query('INSERT INTO Roles SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data, connection = null) {
    const dbConn = connection || db;
    await dbConn.query('UPDATE Roles SET ? WHERE Rol_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id, connection = null) {
    const dbConn = connection || db;
    const [result] = await dbConn.query('DELETE FROM Roles WHERE Rol_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new RolesRepository();