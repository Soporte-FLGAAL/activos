const db = require('../../config/database');

class PolizasRepository {
  async findAll(filters = {}) {
    const { unidadId, aseguradoraId, vigente } = filters;
    let sql = `
      SELECT p.*, a.Ase_nombre AS aseguradora_nombre, u.Uni_no_economico, tp.TpP_nombre AS tipo_poliza_nombre
      FROM Polizas p
      JOIN Aseguradoras a ON p.Pol_aseguradora = a.Ase_id
      JOIN Unidades u ON p.Pol_unidad_id = u.Uni_id
      JOIN Tipo_poliza tp ON p.Pol_tipo_poliza = tp.TpP_id
      WHERE 1=1
    `;
    const params = [];
    if (unidadId) {
      sql += ' AND p.Pol_unidad_id = ?';
      params.push(unidadId);
    }
    if (aseguradoraId) {
      sql += ' AND p.Pol_aseguradora = ?';
      params.push(aseguradoraId);
    }
    if (vigente === 'true') {
      sql += ' AND p.Pol_fecha_fin >= CURDATE()';
    } else if (vigente === 'false') {
      sql += ' AND p.Pol_fecha_fin < CURDATE()';
    }
    sql += ' ORDER BY p.Pol_id DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await db.query(
      `SELECT p.*, a.Ase_nombre AS aseguradora_nombre, u.Uni_no_economico, tp.TpP_nombre AS tipo_poliza_nombre
       FROM Polizas p
       JOIN Aseguradoras a ON p.Pol_aseguradora = a.Ase_id
       JOIN Unidades u ON p.Pol_unidad_id = u.Uni_id
       JOIN Tipo_poliza tp ON p.Pol_tipo_poliza = tp.TpP_id
       WHERE p.Pol_id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Polizas SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await db.query('UPDATE Polizas SET ? WHERE Pol_id = ?', [data, id]);
    return this.findById(id);
  }

  async updateUrl(id, url) {
    await db.query('UPDATE Polizas SET Pol_url = ? WHERE Pol_id = ?', [url, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM Polizas WHERE Pol_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new PolizasRepository();