const db = require('../../config/database');

class PermisosRepository {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM Permisos');
    return rows;
  }

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM Permisos WHERE PerM_id = ?', [id]);
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Permisos SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await db.query('UPDATE Permisos SET ? WHERE PerM_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM Permisos WHERE PerM_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new PermisosRepository();