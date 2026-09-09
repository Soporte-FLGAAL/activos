const db = require('../../config/database');

class PolizasRepository {
  async findAll(filters = {}) {
    const { empresaId, unidadId, aseguradoraId, vigente, limit, offset } = filters;
    let sql = `
      SELECT p.*, a.Ase_nombre AS aseguradora_nombre, u.Uni_no_economico, u.Uni_empresa_actual, tp.TpP_nombre AS tipo_poliza_nombre
      FROM Polizas p
      JOIN Aseguradoras a ON p.Pol_aseguradora = a.Ase_id
      JOIN Unidades u ON p.Pol_unidad_id = u.Uni_id
      JOIN Tipo_poliza tp ON p.Pol_tipo_poliza = tp.TpP_id
      WHERE 1=1
    `;
    const params = [];

    if (empresaId) {
      sql += ' AND u.Uni_empresa_actual = ?';
      params.push(empresaId);
    }
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

    // Ordenamiento consistente para paginación
    sql += ' ORDER BY p.Pol_id DESC';

    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }

    const [rows] = await db.query(sql, params);
    return rows;
  }

  async findById(id, empresaId = null) {
    let sql = 
      `SELECT p.*, a.Ase_nombre AS aseguradora_nombre, u.Uni_no_economico, tp.TpP_nombre AS tipo_poliza_nombre
       FROM Polizas p
       JOIN Aseguradoras a ON p.Pol_aseguradora = a.Ase_id
       JOIN Unidades u ON p.Pol_unidad_id = u.Uni_id
       JOIN Tipo_poliza tp ON p.Pol_tipo_poliza = tp.TpP_id
       WHERE p.Pol_id = ?`;

    const params = [id];
    if (empresaId) {
      sql += ' AND u.Uni_empresa_actual = ?';
      params.push(empresaId);
    }
    const [rows] = await db.query(sql, params);
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Polizas SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data, empresaId = null) {
    const params = [data, id];
    let sql = 
    `UPDATE Polizas 
      SET ? 
      WHERE Pol_id = ?
    `
    if (empresaId) {
      sql += ' AND Pol_unidad_id IN (SELECT Uni_id FROM Unidades WHERE Uni_empresa_actual = ?)';
      params.push(empresaId);
    }
    await db.query(sql, params);
    return this.findById(id, empresaId);
  }

  async updateUrl(id, url , empresaId = null) {
    const params = [url, id];
    let sql = 
    `UPDATE Polizas 
      SET Pol_url = ? 
      WHERE Pol_id = ?
    `
    if (empresaId) {
      sql += ' AND Pol_unidad_id IN (SELECT Uni_id FROM Unidades WHERE Uni_empresa_actual = ?)';
      params.push(empresaId);
    }
    await db.query(sql, params);
    return this.findById(id, empresaId);
  }
  
  async delete(id, empresaId = null) {
    const params = [id];
    let sql = 
    `DELETE FROM Polizas 
      WHERE Pol_id = ?
    `
    if (empresaId) {
      sql += ' AND Pol_unidad_id IN (SELECT Uni_id FROM Unidades WHERE Uni_empresa_actual = ?)';
      params.push(empresaId);
    }
    const [result] = await db.query(sql, params);
    return result.affectedRows > 0;
  }
}

module.exports = new PolizasRepository();