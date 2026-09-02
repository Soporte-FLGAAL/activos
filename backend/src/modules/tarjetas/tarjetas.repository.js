const db = require('../../config/database');

class TarjetasRepository {
  async findAll(filters = {}) {
    const { unidadId, status, vencida, limit, offset } = filters;
    let sql = `
      SELECT tc.*, u.Uni_no_economico, tt.TpT_nombre AS tipo_tarjeta_nombre, p.Pla_placas
      FROM Tarjeta_circulacion tc
      JOIN Unidades u ON tc.TC_unidad_id = u.Uni_id
      JOIN Tipo_tarjeta tt ON tc.TC_tipo = tt.TpT_id
      JOIN Placas p ON tc.TC_placas_id = p.Pla_id
      WHERE 1=1
    `;
    const params = [];

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
    const { unidadId, status, vencida } = filters;
    let sql = 'SELECT COUNT(*) AS total FROM Tarjeta_circulacion tc WHERE 1=1';
    const params = [];

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

  async findById(id) {
    const [rows] = await db.query(
      `SELECT tc.*, u.Uni_no_economico, tt.TpT_nombre AS tipo_tarjeta_nombre, p.Pla_placas
       FROM Tarjeta_circulacion tc
       JOIN Unidades u ON tc.TC_unidad_id = u.Uni_id
       JOIN Tipo_tarjeta tt ON tc.TC_tipo = tt.TpT_id
       JOIN Placas p ON tc.TC_placas_id = p.Pla_id
       WHERE tc.TC_id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Tarjeta_circulacion SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await db.query('UPDATE Tarjeta_circulacion SET ? WHERE TC_id = ?', [data, id]);
    return this.findById(id);
  }

  async updateUrl(id, url) {
    await db.query('UPDATE Tarjeta_circulacion SET TC_url = ? WHERE TC_id = ?', [url, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM Tarjeta_circulacion WHERE TC_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new TarjetasRepository();