const db = require('../../config/database');

class TarjetasRepository {
  async findAll(filters = {}) {
    const { unidadId, status, vencida, empresaId, limit, offset } = filters;
    let sql = `
      SELECT tc.*, u.Uni_no_economico, tt.TpT_nombre AS tipo_tarjeta_nombre, p.Pla_placas
      FROM Tarjeta_circulacion tc
      JOIN Unidades u ON tc.TC_unidad_id = u.Uni_id
      JOIN Tipo_tarjeta tt ON tc.TC_tipo = tt.TpT_id
      JOIN Placas p ON tc.TC_placas_id = p.Pla_id
      WHERE 1=1
    `;
    const params = [];

    if (empresaId) {
      sql += ' AND u.Uni_empresa_actual = ?';
      params.push(empresaId);
    }
    if (unidadId) {
      sql += ' AND tc.TC_unidad_id = ?';
      params.push(unidadId);
    }
    if (status) {
      sql += ' AND tc.TC_status = ?';
      params.push(status);
    }
    if (vencida === 'true') {
      sql += ' AND tc.TC_fecha_vencimiento < CURDATE()';
    } else if (vencida === 'false') {
      sql += ' AND (tc.TC_fecha_vencimiento >= CURDATE() OR tc.TC_fecha_vencimiento IS NULL)';
    }

    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }

    const [rows] = await db.query(sql, params);
    return rows;
  }

  async count(filters = {}) {
    const { unidadId, status, vencida, empresaId } = filters;
    // Aquí estaba el bug: faltaba el JOIN a Unidades
    let sql = `
      SELECT COUNT(*) AS total
      FROM Tarjeta_circulacion tc
      JOIN Unidades u ON tc.TC_unidad_id = u.Uni_id
      WHERE 1=1
    `;
    const params = [];

    if (empresaId) {
      sql += ' AND u.Uni_empresa_actual = ?';
      params.push(empresaId);
    }
    if (unidadId) {
      sql += ' AND tc.TC_unidad_id = ?';
      params.push(unidadId);
    }
    if (status) {
      sql += ' AND tc.TC_status = ?';
      params.push(status);
    }
    if (vencida === 'true') {
      sql += ' AND tc.TC_fecha_vencimiento < CURDATE()';
    } else if (vencida === 'false') {
      sql += ' AND (tc.TC_fecha_vencimiento >= CURDATE() OR tc.TC_fecha_vencimiento IS NULL)';
    }

    const [rows] = await db.query(sql, params);
    return rows[0].total;
  }

  async findById(id, empresaId = null) {
    let sql = `
      SELECT tc.*, u.Uni_no_economico, u.Uni_empresa_actual, tt.TpT_nombre AS tipo_tarjeta_nombre, p.Pla_placas
      FROM Tarjeta_circulacion tc
      JOIN Unidades u ON tc.TC_unidad_id = u.Uni_id
      JOIN Tipo_tarjeta tt ON tc.TC_tipo = tt.TpT_id
      JOIN Placas p ON tc.TC_placas_id = p.Pla_id
      WHERE tc.TC_id = ?
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
    const [result] = await db.query('INSERT INTO Tarjeta_circulacion SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data, empresaId = null, connection = null) {
    const dbConn = connection || db;
    // Solo actualizar si pertenece a la empresa (si se proporciona empresaId)
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