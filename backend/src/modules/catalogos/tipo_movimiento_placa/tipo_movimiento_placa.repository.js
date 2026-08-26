const db = require('../../../config/database');

class TipoMovimientoPlacaRepository {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM Tipo_movimiento_placa');
    return rows;
  }

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM Tipo_movimiento_placa WHERE TpMP_id = ?', [id]);
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Tipo_movimiento_placa SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await db.query('UPDATE Tipo_movimiento_placa SET ? WHERE TpMP_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM Tipo_movimiento_placa WHERE TpMP_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new TipoMovimientoPlacaRepository();