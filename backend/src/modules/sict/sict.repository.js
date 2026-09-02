const db = require('../../config/database');

class SictRepository {
  async findAll(filters = {}) {
    const { unidadId, limit, offset } = filters;
    let sql = `
      SELECT s.*, u.Uni_no_economico
      FROM SICT s
      JOIN Unidades u ON s.SICT_unidad_id = u.Uni_id
      WHERE 1=1
    `;
    const params = [];

    if (unidadId) {
      sql += ' AND s.SICT_unidad_id = ?';
      params.push(unidadId);
    }

    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }

    const [rows] = await db.query(sql, params);
    return rows;
  }

  async count(filters = {}) {
    const { unidadId } = filters;
    let sql = 'SELECT COUNT(*) AS total FROM SICT s WHERE 1=1';
    const params = [];

    if (unidadId) {
      sql += ' AND s.SICT_unidad_id = ?';
      params.push(unidadId);
    }

    const [rows] = await db.query(sql, params);
    return rows[0].total;
  }

  async findById(id) {
    const [rows] = await db.query(
      `SELECT s.*, u.Uni_no_economico
       FROM SICT s
       JOIN Unidades u ON s.SICT_unidad_id = u.Uni_id
       WHERE s.SICT_id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO SICT SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await db.query('UPDATE SICT SET ? WHERE SICT_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM SICT WHERE SICT_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new SictRepository();