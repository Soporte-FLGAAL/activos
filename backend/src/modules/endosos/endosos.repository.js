const db = require('../../config/database');

class EndososRepository {
  async findAll(filters = {}) {
    const { polizaId, limit, offset } = filters;
    let sql = `
      SELECT e.*, p.Pol_poliza
      FROM Endoso e
      JOIN Polizas p ON e.End_poliza = p.Pol_id
      WHERE 1=1
    `;
    const params = [];

    if (polizaId) {
      sql += ' AND e.End_poliza = ?';
      params.push(polizaId);
    }

    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }

    const [rows] = await db.query(sql, params);
    return rows;
  }

  async count(filters = {}) {
    const { polizaId } = filters;
    let sql = 'SELECT COUNT(*) AS total FROM Endoso e WHERE 1=1';
    const params = [];

    if (polizaId) {
      sql += ' AND e.End_poliza = ?';
      params.push(polizaId);
    }

    const [rows] = await db.query(sql, params);
    return rows[0].total;
  }

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM Endoso WHERE End_id = ?', [id]);
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Endoso SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await db.query('UPDATE Endoso SET ? WHERE End_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM Endoso WHERE End_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new EndososRepository();