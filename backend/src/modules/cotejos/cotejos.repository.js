const db = require('../../config/database');

class CotejosRepository {
  async findAll(tarjetaId = null) {
    let sql = `
      SELECT c.*, tc.TC_tarjeta
      FROM Cotejos c
      JOIN Tarjeta_circulacion tc ON c.Cot_tarjeta_id = tc.TC_id
    `;
    const params = [];
    if (tarjetaId) {
      sql += ' WHERE c.Cot_tarjeta_id = ?';
      params.push(tarjetaId);
    }
    sql += ' ORDER BY c.Cot_id DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await db.query(
      `SELECT c.*, tc.TC_tarjeta
       FROM Cotejos c
       JOIN Tarjeta_circulacion tc ON c.Cot_tarjeta_id = tc.TC_id
       WHERE c.Cot_id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Cotejos SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await db.query('UPDATE Cotejos SET ? WHERE Cot_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM Cotejos WHERE Cot_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new CotejosRepository();