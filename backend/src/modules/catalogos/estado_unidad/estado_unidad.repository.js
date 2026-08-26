const db = require('../../../config/database');

class EstadoUnidadRepository {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM Estado_unidad');
    return rows;
  }

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM Estado_unidad WHERE EsU_id = ?', [id]);
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Estado_unidad SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await db.query('UPDATE Estado_unidad SET ? WHERE EsU_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM Estado_unidad WHERE EsU_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new EstadoUnidadRepository();