const db = require('../../config/database');

class AseguradorasRepository {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM Aseguradoras');
    return rows;
  }

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM Aseguradoras WHERE Ase_id = ?', [id]);
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Aseguradoras SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await db.query('UPDATE Aseguradoras SET ? WHERE Ase_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM Aseguradoras WHERE Ase_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new AseguradorasRepository();