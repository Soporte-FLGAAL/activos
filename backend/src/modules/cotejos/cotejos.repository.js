const db = require('../../config/database');

class CotejosRepository {
  async findAll(filters = {}) {
    const { tarjetaId, limit, offset } = filters;
    let sql = `
      SELECT c.*, tc.TC_tarjeta
      FROM Cotejos c
      JOIN Tarjeta_circulacion tc ON c.Cot_tarjeta_id = tc.TC_id
      WHERE 1=1
    `;
    const params = [];
    if (tarjetaId) {
      sql += ' AND c.Cot_tarjeta_id = ?';
      params.push(tarjetaId);
    }
    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async count(filters = {}) {
    const { tarjetaId } = filters;
    let sql = 'SELECT COUNT(*) AS total FROM Cotejos c WHERE 1=1';
    const params = [];
    if (tarjetaId) {
      sql += ' AND c.Cot_tarjeta_id = ?';
      params.push(tarjetaId);
    }
    const [rows] = await db.query(sql, params);
    return rows[0].total;
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