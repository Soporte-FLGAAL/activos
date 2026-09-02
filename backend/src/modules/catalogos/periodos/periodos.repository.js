const db = require('../../../config/database');

class PeriodosRepository {
  async findAll(filters = {}) {
    const { limit, offset } = filters;
    let sql = 'SELECT * FROM Periodos';
    const params = [];
    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async count(filters = {}) {
    const [rows] = await db.query('SELECT COUNT(*) AS total FROM Periodos');
    return rows[0].total;
  }

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM Periodos WHERE Per_id = ?', [id]);
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Periodos SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await db.query('UPDATE Periodos SET ? WHERE Per_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM Periodos WHERE Per_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new PeriodosRepository();