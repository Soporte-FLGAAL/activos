const db = require('../../../config/database');

class TipoUnidadRepository {
  async findAll(filters = {}) {
    const { limit, offset } = filters;
    let sql = 'SELECT * FROM Tipo_unidad';
    const params = [];
    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async count(filters = {}) {
    const [rows] = await db.query('SELECT COUNT(*) AS total FROM Tipo_unidad');
    return rows[0].total;
  }

  async findById(id, connection = null) {
    const dbConn = connection || db;
    const [rows] = await dbConn.query('SELECT * FROM Tipo_unidad WHERE TpU_id = ?', [id]);
    return rows[0] || null;
  }

  async create(data, connection = null) {
    const dbConn = connection || db;
    const [result] = await dbConn.query('INSERT INTO Tipo_unidad SET ?', data);
    return result.insertId;
  }

  async update(id, data, connection = null) {
    const dbConn = connection || db;
    const [result] = await dbConn.query('UPDATE Tipo_unidad SET ? WHERE TpU_id = ?', [data, id]);
    return result.affectedRows > 0;
  }

  async delete(id, connection = null) {
    const dbConn = connection || db;
    const [result] = await dbConn.query('DELETE FROM Tipo_unidad WHERE TpU_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new TipoUnidadRepository();