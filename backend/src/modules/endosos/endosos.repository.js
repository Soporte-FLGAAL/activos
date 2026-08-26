const db = require('../../config/database');

class EndososRepository {
  async findAll(polizaId = null) {
    let sql = 'SELECT * FROM Endoso';
    const params = [];
    if (polizaId) {
      sql += ' WHERE End_poliza = ?';
      params.push(polizaId);
    }
    sql += ' ORDER BY End_id DESC';
    const [rows] = await db.query(sql, params);
    return rows;
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