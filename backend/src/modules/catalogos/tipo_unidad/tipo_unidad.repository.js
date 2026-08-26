const db = require('../../../config/database');

class TipoUnidadRepository {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM Tipo_unidad');
    return rows;
  }

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM Tipo_unidad WHERE TpU_id = ?', [id]);
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Tipo_unidad SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await db.query('UPDATE Tipo_unidad SET ? WHERE TpU_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM Tipo_unidad WHERE TpU_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new TipoUnidadRepository();