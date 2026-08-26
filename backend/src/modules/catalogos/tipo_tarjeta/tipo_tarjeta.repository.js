const db = require('../../../config/database');

class TipoTarjetaRepository {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM Tipo_tarjeta');
    return rows;
  }

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM Tipo_tarjeta WHERE TpT_id = ?', [id]);
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Tipo_tarjeta SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await db.query('UPDATE Tipo_tarjeta SET ? WHERE TpT_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM Tipo_tarjeta WHERE TpT_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new TipoTarjetaRepository();