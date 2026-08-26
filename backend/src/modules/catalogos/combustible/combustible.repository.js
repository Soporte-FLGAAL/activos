const db = require('../../../config/database');

class CombustibleRepository {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM Combustible');
    return rows;
  }

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM Combustible WHERE Com_id = ?', [id]);
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Combustible SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await db.query('UPDATE Combustible SET ? WHERE Com_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM Combustible WHERE Com_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new CombustibleRepository();