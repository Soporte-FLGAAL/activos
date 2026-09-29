const db = require('../../config/database');

class UnidadesRepository {
  async findAll(filters = {}) {
    const { empresaId, tipoId, combustibleId, ejes, status, search, limit, offset } = filters;
    let sql = `
      SELECT u.*, tu.TpU_nombre AS tipo_nombre, eu.EsU_estado AS estado_nombre,
             c.Com_nombre AS combustible_nombre, p1.Emp_nombre AS propietario_nombre,
             p2.Emp_nombre AS empresa_nombre, per1.Per_nombre AS periodo_mecanica,
             per2.Per_nombre AS periodo_contaminantes
      FROM Unidades u
      JOIN Tipo_unidad tu ON u.Uni_tipo = tu.TpU_id
      JOIN Estado_unidad eu ON u.Uni_estado = eu.EsU_id
      JOIN Combustible c ON u.Uni_combustible = c.Com_id
      JOIN Empresas p1 ON u.Uni_propietario = p1.Emp_id
      JOIN Empresas p2 ON u.Uni_empresa_actual = p2.Emp_id
      JOIN Periodos per1 ON u.Uni_periodo_verificacion_mecanica = per1.Per_id
      JOIN Periodos per2 ON u.Uni_periodo_verificacion_contaminantes = per2.Per_id
      WHERE 1=1
    `;
    const params = [];

    if (empresaId) {
      sql += ' AND u.Uni_empresa_actual = ?';
      params.push(empresaId);
    }
    if (tipoId) {
      sql += ' AND u.Uni_tipo = ?';
      params.push(tipoId);
    }
    if (combustibleId) {
      sql += ' AND u.Uni_combustible = ?';
      params.push(combustibleId);
    }
    if (ejes) {
      sql += ' AND u.Uni_ejes = ?';
      params.push(ejes);
    }
    if (status) {
      sql += ' AND u.Uni_status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (u.Uni_no_economico LIKE ? OR u.Uni_no_serie LIKE ? OR u.Uni_no_motor LIKE ? OR u.Uni_marca LIKE ? OR u.Uni_modelo LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like, like, like);
    }
    sql += ' ORDER BY u.Uni_id DESC';
    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async count(filters = {}) {
    const { empresaId, tipoId, combustibleId, ejes, status, search } = filters;
    let sql = `SELECT COUNT(*) AS total FROM Unidades u WHERE 1=1`;
    const params = [];
    // aplicar mismas condiciones de filtrado que en findAll (sin limit/offset)
    if (empresaId) { sql += ' AND u.Uni_empresa_actual = ?'; params.push(empresaId); }
    if (tipoId) { sql += ' AND u.Uni_tipo = ?'; params.push(tipoId); }
    if (combustibleId) { sql += ' AND u.Uni_combustible = ?'; params.push(combustibleId); }
    if (ejes) { sql += ' AND u.Uni_ejes = ?'; params.push(ejes); }
    if (status) { sql += ' AND u.Uni_status = ?'; params.push(status); }
    if (search) { sql += ' AND (u.Uni_no_economico LIKE ? OR u.Uni_no_serie LIKE ? OR u.Uni_no_motor LIKE ? OR u.Uni_marca LIKE ? OR u.Uni_modelo LIKE ?)'; const like = `%${search}%`; params.push(like, like, like, like, like); }
    const [rows] = await db.query(sql, params);
    return rows[0].total;
  }

  async findById(id, empresaId = null) {
    let sql = `
      SELECT u.*, tu.TpU_nombre AS tipo_nombre, eu.EsU_estado AS estado_nombre,
            c.Com_nombre AS combustible_nombre, p1.Emp_nombre AS propietario_nombre,
            p2.Emp_nombre AS empresa_nombre, per1.Per_nombre AS periodo_mecanica,
            per2.Per_nombre AS periodo_contaminantes
      FROM Unidades u
      JOIN Tipo_unidad tu ON u.Uni_tipo = tu.TpU_id
      JOIN Estado_unidad eu ON u.Uni_estado = eu.EsU_id
      JOIN Combustible c ON u.Uni_combustible = c.Com_id
      JOIN Empresas p1 ON u.Uni_propietario = p1.Emp_id
      JOIN Empresas p2 ON u.Uni_empresa_actual = p2.Emp_id
      JOIN Periodos per1 ON u.Uni_periodo_verificacion_mecanica = per1.Per_id
      JOIN Periodos per2 ON u.Uni_periodo_verificacion_contaminantes = per2.Per_id
      WHERE u.Uni_id = ?
    `;
    const params = [id];
    if (empresaId) {
      sql += ' AND u.Uni_empresa_actual = ?';
      params.push(empresaId);
    }
    const [rows] = await db.query(sql, params);
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Unidades SET ?', [data]);
    return this.findById(result.insertId);
  }

  async update(id, data, empresaId = null, connection = null) {
    const dbConn = connection || db;
    let sql = 'UPDATE Unidades SET ? WHERE Uni_id = ?';
    const params = [data, id];
    if (empresaId) {
      sql += ' AND Uni_empresa_actual = ?';
      params.push(empresaId);
    }
    const [result] = await dbConn.query(sql, params);
    return result.affectedRows > 0;
  }

  async updateCampo(id, campo, valor) {
    const [result] = await db.query(`UPDATE Unidades SET ${campo} = ? WHERE Uni_id = ?`, [valor, id]);
    return result.affectedRows > 0;
  }

  async delete(id, empresaId = null, connection = null) {
    const dbConn = connection || db;
    let sql = 'DELETE FROM Unidades WHERE Uni_id = ?';
    const params = [id];
    if (empresaId) {
      sql += ' AND Uni_empresa_actual = ?';
      params.push(empresaId);
    }
    const [result] = await dbConn.query(sql, params);
    return result.affectedRows > 0;
  }

  async countByEmpresa(empresaId) {
    const [rows] = await db.query(
      'SELECT COUNT(*) AS total FROM Unidades WHERE Uni_empresa_actual = ? AND Uni_status = "ALTA"',
      [empresaId]
    );
    return rows[0].total;
  }

  async getResumen(empresaId) {
    const [rows] = await db.query(
      `SELECT Uni_id, Uni_no_economico, Uni_status, Uni_marca, Uni_modelo, Uni_anio_modelo
       FROM Unidades
       WHERE Uni_empresa_actual = ?
       ORDER BY Uni_no_economico`,
      [empresaId]
    );
    return rows;
  }
}

module.exports = new UnidadesRepository();