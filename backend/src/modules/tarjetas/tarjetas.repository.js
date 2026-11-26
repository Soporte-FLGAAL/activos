const db = require('../../config/database');

class TarjetasRepository {
  _buildFilters(filters = {}) {
    const { unidadId, status, vencida, empresaId, search } = filters;
    let where = ' WHERE 1=1';
    const params = [];

    if (empresaId) {
      where += ' AND (u.Uni_empresa_actual = ? OR u.Uni_propietario = ?)';
      params.push(empresaId, empresaId);
    }
    if (unidadId) {
      where += ' AND tc.TC_unidad_id = ?';
      params.push(unidadId);
    }
    if (status) {
      where += ' AND tc.TC_status = ?';
      params.push(status);
    }
    if (vencida === 'true') {
      where += ' AND tc.TC_fecha_vencimiento < CURDATE()';
    } else if (vencida === 'false') {
      where += ' AND (tc.TC_fecha_vencimiento >= CURDATE() OR tc.TC_fecha_vencimiento IS NULL)';
    }
    if (search) {
      where += ' AND (tc.TC_tarjeta LIKE ? OR u.Uni_no_economico LIKE ? OR p.Pla_placas LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    return { where, params };
  }

  async findAll(filters = {}) {
    const { limit, offset } = filters;
    const { where, params } = this._buildFilters(filters);
    let sql = `
      SELECT tc.*, u.Uni_no_economico, u.Uni_empresa_actual,
             tt.TpT_nombre AS tipo_tarjeta_nombre, p.Pla_placas,
             e.Emp_nombre AS empresa_nombre
      FROM Tarjeta_circulacion tc
      JOIN Unidades u ON tc.TC_unidad_id = u.Uni_id
      JOIN Tipo_tarjeta tt ON tc.TC_tipo = tt.TpT_id
      JOIN Placas p ON tc.TC_placas_id = p.Pla_id AND p.Pla_empresa_actual = u.Uni_empresa_actual
      JOIN Empresas e ON u.Uni_empresa_actual = e.Emp_id
      ${where}
      ORDER BY tc.TC_id DESC
    `;
    const queryParams = [...params];
    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);
    }
    const [rows] = await db.query(sql, queryParams);
    return rows;
  }

  async count(filters = {}) {
    const { where, params } = this._buildFilters(filters);
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM Tarjeta_circulacion tc
       JOIN Unidades u ON tc.TC_unidad_id = u.Uni_id
       JOIN Placas p ON tc.TC_placas_id = p.Pla_id
       ${where}`,
      params
    );
    return rows[0].total;
  }

  async findById(id, empresaId = null, connection = null) {
    const dbConn = connection || db;
    let sql = `
      SELECT tc.*, u.Uni_no_economico, u.Uni_empresa_actual,
             tt.TpT_nombre AS tipo_tarjeta_nombre, p.Pla_placas,
             p.Pla_empresa_actual, e.Emp_nombre AS empresa_nombre
      FROM Tarjeta_circulacion tc
      JOIN Unidades u ON tc.TC_unidad_id = u.Uni_id
      JOIN Tipo_tarjeta tt ON tc.TC_tipo = tt.TpT_id
      JOIN Placas p ON tc.TC_placas_id = p.Pla_id
      JOIN Empresas e ON u.Uni_empresa_actual = e.Emp_id
      WHERE tc.TC_id = ?
    `;
    const params = [id];
    if (empresaId) {
      sql += ' AND (u.Uni_empresa_actual = ? OR u.Uni_propietario = ?)';
      params.push(empresaId, empresaId);
    }
    const [rows] = await dbConn.query(sql, params);
    return rows[0] || null;
  }

  async create(data, connection = null) {
    const dbConn = connection || db;
    const [result] = await dbConn.query('INSERT INTO Tarjeta_circulacion SET ?', data);
    return result.insertId;
  }

  async update(id, data, empresaId = null, connection = null) {
    const dbConn = connection || db;
    const sql = 'UPDATE Tarjeta_circulacion SET ? WHERE TC_id = ?' + (empresaId ? ' AND TC_unidad_id IN (SELECT Uni_id FROM Unidades WHERE Uni_empresa_actual = ?)' : '');
    const params = [data, id];
    if (empresaId) params.push(empresaId);
    const [result] = await dbConn.query(sql, params);
    return result.affectedRows > 0;
  }

  async updateUrl(id, url, empresaId = null, connection = null) {
    const dbConn = connection || db;
    const sql = 'UPDATE Tarjeta_circulacion SET TC_url = ? WHERE TC_id = ?' + (empresaId ? ' AND TC_unidad_id IN (SELECT Uni_id FROM Unidades WHERE Uni_empresa_actual = ?)' : '');
    const params = [url, id];
    if (empresaId) params.push(empresaId);
    const [result] = await dbConn.query(sql, params);
    return result.affectedRows > 0;
  }

  async delete(id, empresaId = null, connection = null) {
    const dbConn = connection || db;
    const sql = 'DELETE FROM Tarjeta_circulacion WHERE TC_id = ?' + (empresaId ? ' AND TC_unidad_id IN (SELECT Uni_id FROM Unidades WHERE Uni_empresa_actual = ?)' : '');
    const params = [id];
    if (empresaId) params.push(empresaId);
    const [result] = await dbConn.query(sql, params);
    return result.affectedRows > 0;
  }
}

module.exports = new TarjetasRepository();
