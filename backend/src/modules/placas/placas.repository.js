const db = require('../../config/database');

class PlacasRepository {
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

  async count(filters = {}) {
    const { empresaId } = filters;
    let sql = 'SELECT COUNT(*) AS total FROM Placas p WHERE 1=1';
    const params = [];

    if (empresaId) {
      sql += ' AND p.Pla_empresa_actual = ?';
      params.push(empresaId);
    }

    const [rows] = await db.query(sql, params);
    return rows[0].total;
  }

  async findById(id, empresaId = null) {
    let sql = `
      SELECT p.*, e1.Emp_nombre AS propietario_nombre, e2.Emp_nombre AS empresa_nombre
      FROM Placas p
      LEFT JOIN Empresas e1 ON p.Pla_propietario = e1.Emp_id
      JOIN Empresas e2 ON p.Pla_empresa_actual = e2.Emp_id
      WHERE p.Pla_id = ?
    `;
    const params = [id];
    if (empresaId) {
      sql += ' AND p.Pla_empresa_actual = ?';
      params.push(empresaId);
    }
    const [rows] = await db.query(sql, params);
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Placas SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data, empresaId = null) {
    const params = [data, id];
    let sql =
    `
    UPDATE Placas 
      SET ? 
      WHERE Pla_id = ?
    `
    if (empresaId) {
      sql += ' AND Pla_empresa_actual = ?';
      params.push(empresaId);
    }
    await db.query(sql, params);
    return this.findById(id, empresaId);
  }

  async delete(id, empresaId = null) {
    const params = [id];
    let sql =
    `
    DELETE FROM Placas 
      WHERE Pla_id = ?
    `
    if (empresaId) {
      sql += ' AND Pla_empresa_actual = ?';
      params.push(empresaId);
    }
    const [result] = await db.query(sql, params);
    return result.affectedRows > 0;
  }
}

module.exports = new PlacasRepository();