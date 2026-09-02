const db = require('../../config/database');

class DobleArticuladoRepository {
  async findAll(filters = {}) {
    const { unidadId, limit, offset } = filters;
    let sql = `
      SELECT pda.*, u.Uni_no_economico
      FROM Doble_articulado pda
      JOIN Unidades u ON pda.PDA_unidad_id = u.Uni_id
      WHERE 1=1
    `;
    const params = [];
    if (unidadId) {
      sql += ' AND pda.PDA_unidad_id = ?';
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
    let sql = 'SELECT COUNT(*) AS total FROM Doble_articulado pda WHERE 1=1';
    const params = [];
    if (unidadId) {
      sql += ' AND pda.PDA_unidad_id = ?';
      params.push(unidadId);
    }
    const [rows] = await db.query(sql, params);
    return rows[0].total;
  }

  async findById(id) {
    const [rows] = await db.query(
      `SELECT pda.*, u.Uni_no_economico
       FROM Doble_articulado pda
       JOIN Unidades u ON pda.PDA_unidad_id = u.Uni_id
       WHERE pda.PDA_id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Doble_articulado SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await db.query('UPDATE Doble_articulado SET ? WHERE PDA_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM Doble_articulado WHERE PDA_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new DobleArticuladoRepository();