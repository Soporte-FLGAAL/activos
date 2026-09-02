const db = require('../../config/database');

class PlacasRepository {
  async findAll(filters = {}) {
    const { empresaId, limit, offset } = filters;
    let sql = `
      SELECT p.*, e1.Emp_nombre AS propietario_nombre, e2.Emp_nombre AS empresa_nombre
      FROM Placas p
      LEFT JOIN Empresas e1 ON p.Pla_propietario = e1.Emp_id
      JOIN Empresas e2 ON p.Pla_empresa_actual = e2.Emp_id
      WHERE 1=1
    `;
    const params = [];

    if (empresaId) {
      sql += ' AND p.Pla_empresa_actual = ?';
      params.push(empresaId);
    }

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

  async actualizarPlacaConMovimiento(idPlaca, dataPlaca, dataMovimiento, usuarioId) {
    await this.obtener(idPlaca);
    if (!(await existeRegistro('Tipo_movimiento_placa', 'TpMP_id', dataMovimiento.tipoMovimientoId))) {
      const error = new Error('El tipo de movimiento no existe');
      error.status = 422;
      throw error;
    }

    return withTransaction(async (connection) => {
      // Construir SET dinámico para actualizar placa
      const campos = [];
      const valores = [];
      if (dataPlaca.placas !== undefined) { campos.push('Pla_placas = ?'); valores.push(dataPlaca.placas); }
      if (dataPlaca.status !== undefined) { campos.push('Pla_status = ?'); valores.push(dataPlaca.status); }
      if (dataPlaca.propietarioId !== undefined) { campos.push('Pla_propietario = ?'); valores.push(dataPlaca.propietarioId); }
      if (dataPlaca.empresaActualId !== undefined) { campos.push('Pla_empresa_actual = ?'); valores.push(dataPlaca.empresaActualId); }

      if (campos.length > 0) {
        valores.push(idPlaca);
        await connection.query(`UPDATE Placas SET ${campos.join(', ')} WHERE Pla_id = ?`, valores);
      }

      // Insertar detalle de movimiento
      await connection.query(
        `INSERT INTO Detalle_placas (DP_placas_id, DP_tipo_movimiento, DP_costo, DP_fecha, DP_url)
         VALUES (?,?,?,?,?)`,
        [idPlaca, dataMovimiento.tipoMovimientoId, dataMovimiento.costo, dataMovimiento.fecha, dataMovimiento.url]
      );

      // Auditoría
      await connection.query(
        `INSERT INTO Movimientos (Mov_tabla_afectada, Mov_registro_afectado, Mov_accion, Mov_detalles, Mov_usu_id)
         VALUES ('Placas', ?, (SELECT AcM_id FROM Acciones_movimiento WHERE AcM_nombre = 'UPDATE'), ?, ?)`,
        [idPlaca.toString(), JSON.stringify({ dataPlaca, dataMovimiento }), usuarioId]
      );

      return true;
    });
  }  

  async findById(id) {
    const [rows] = await db.query(
      `SELECT p.*, e1.Emp_nombre AS propietario_nombre, e2.Emp_nombre AS empresa_nombre
       FROM Placas p
       LEFT JOIN Empresas e1 ON p.Pla_propietario = e1.Emp_id
       JOIN Empresas e2 ON p.Pla_empresa_actual = e2.Emp_id
       WHERE p.Pla_id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query('INSERT INTO Placas SET ?', data);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await db.query('UPDATE Placas SET ? WHERE Pla_id = ?', [data, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM Placas WHERE Pla_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new PlacasRepository();