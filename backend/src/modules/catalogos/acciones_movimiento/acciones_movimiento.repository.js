const db = require('../../../config/database');

class AccionesMovimientoRepository {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM Acciones_movimiento');
    return rows;
  }

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM Acciones_movimiento WHERE AcM_id = ?', [id]);
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Acciones_movimiento SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await db.query('UPDATE Acciones_movimiento SET ? WHERE AcM_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM Acciones_movimiento WHERE AcM_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new AccionesMovimientoRepository();