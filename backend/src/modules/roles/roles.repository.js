const db = require('../../config/database');

class RolesRepository {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM Roles');
    return rows;
  }

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM Roles WHERE Rol_id = ?', [id]);
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Roles SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await db.query('UPDATE Roles SET ? WHERE Rol_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM Roles WHERE Rol_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new RolesRepository();