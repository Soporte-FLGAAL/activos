const db = require('../../config/database');

class IncisosRepository {
  async findAll(filters = {}) {
    const { endosoId, limit, offset } = filters;
    let sql = `
      SELECT i.*, e.End_endoso
      FROM Inciso i
      JOIN Endoso e ON i.Inc_endoso = e.End_id
      WHERE 1=1
    `;
    const params = [];

    if (endosoId) {
      sql += ' AND i.Inc_endoso = ?';
      params.push(endosoId);
    }

    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }

    const [rows] = await db.query(sql, params);
    return rows;
  }

  async count(filters = {}) {
    const { endosoId } = filters;
    let sql = 'SELECT COUNT(*) AS total FROM Inciso i WHERE 1=1';
    const params = [];

    if (endosoId) {
      sql += ' AND i.Inc_endoso = ?';
      params.push(endosoId);
    }

    const [rows] = await db.query(sql, params);
    return rows[0].total;
  }

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM Inciso WHERE Inc_id = ?', [id]);
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Inciso SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await db.query('UPDATE Inciso SET ? WHERE Inc_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM Inciso WHERE Inc_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new IncisosRepository();