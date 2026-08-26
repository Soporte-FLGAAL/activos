const db = require('../../../config/database');

class TipoPolizaRepository {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM Tipo_poliza');
    return rows;
  }

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM Tipo_poliza WHERE TpP_id = ?', [id]);
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Tipo_poliza SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await db.query('UPDATE Tipo_poliza SET ? WHERE TpP_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM Tipo_poliza WHERE TpP_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new TipoPolizaRepository();