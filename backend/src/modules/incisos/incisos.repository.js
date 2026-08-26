const db = require('../../config/database');

class IncisosRepository {
  async findAll(endosoId = null) {
    let sql = 'SELECT * FROM Inciso';
    const params = [];
    if (endosoId) {
      sql += ' WHERE Inc_endoso = ?';
      params.push(endosoId);
    }
    sql += ' ORDER BY Inc_id DESC';
    const [rows] = await db.query(sql, params);
    return rows;
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