const db = require('../../config/database');
const { hashPassword } = require('../../utils/password');

class UsuariosRepository {
  async findAll(filters = {}) {
    const { empresaId, limit, offset } = filters;
    let sql = `
      SELECT DISTINCT u.Usu_id, u.Usu_nombres, u.Usu_ap_paterno, u.Usu_ap_materno,
             u.Usu_telefono, u.Usu_correo, u.Usu_status,
             u.Usu_fecha_creacion, u.Usu_ultimo_acceso
      FROM Usuario u
    `;
    const params = [];

    if (empresaId) {
      sql += ' JOIN Usuario_Empresas ue ON u.Usu_id = ue.UE_usuario AND ue.UE_empresa = ?';
      params.push(empresaId);
    }

    sql += ' ORDER BY u.Usu_id DESC';

    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }

    const [rows] = await db.query(sql, params);
    return rows;
  }

  async count(filters = {}) {
    const { empresaId } = filters;
    let sql = 'SELECT COUNT(DISTINCT u.Usu_id) AS total FROM Usuario u';
    const params = [];
    if (empresaId) {
      sql += ' JOIN Usuario_Empresas ue ON u.Usu_id = ue.UE_usuario AND ue.UE_empresa = ?';
      params.push(empresaId);
    }
    const [rows] = await db.query(sql, params);
    return rows[0].total;
  }

  async findById(id, empresaId = null) {
    let sql = `
      SELECT u.Usu_id, u.Usu_nombres, u.Usu_ap_paterno, u.Usu_ap_materno,
             u.Usu_telefono, u.Usu_correo, u.Usu_status,
             u.Usu_fecha_creacion, u.Usu_ultimo_acceso
      FROM Usuario u
    `;
    const params = [id];

    if (empresaId) {
      sql += `
        JOIN Usuario_Empresas ue ON u.Usu_id = ue.UE_usuario AND ue.UE_empresa = ?
        WHERE u.Usu_id = ?
      `;
      params.unshift(empresaId); // orden: empresaId, id
    } else {
      sql += ' WHERE u.Usu_id = ?';
    }

    const [rows] = await db.query(sql, params);
    return rows[0] || null;
  }

  async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM Usuario WHERE Usu_correo = ?', [email]);
    return rows[0] || null;
  }

  async create(data, connection = null) {
    const dbConn = connection || db;
    const hashedPassword = await hashPassword(data.Usu_password);
    const [result] = await dbConn.query(
      'INSERT INTO Usuario SET ?',
      { ...data, Usu_password: hashedPassword }
    );
    return result.insertId;
  }

  async update(id, data, empresaId = null, connection = null) {
    const dbConn = connection || db;
    if (data.Usu_password) {
      data.Usu_password = await hashPassword(data.Usu_password);
    }

    let sql = 'UPDATE Usuario SET ? WHERE Usu_id = ?';
    const params = [data, id];

    if (empresaId) {
      sql += ' AND Usu_id IN (SELECT UE_usuario FROM Usuario_Empresas WHERE UE_empresa = ?)';
      params.push(empresaId);
    }

    const [result] = await dbConn.query(sql, params);
    return result.affectedRows > 0;
  }

  async updatePassword(id, newPassword, empresaId = null, connection = null) {
    const dbConn = connection || db;
    const hashed = await hashPassword(newPassword);

    let sql = 'UPDATE Usuario SET Usu_password = ? WHERE Usu_id = ?';
    const params = [hashed, id];

    if (empresaId) {
      sql += ' AND Usu_id IN (SELECT UE_usuario FROM Usuario_Empresas WHERE UE_empresa = ?)';
      params.push(empresaId);
    }

    const [result] = await dbConn.query(sql, params);
    return result.affectedRows > 0;
  }

  async delete(id, empresaId = null, connection = null) {
    const dbConn = connection || db;

    // Si se pasa empresaId, solo permite eliminar si el usuario NO está en otra empresa
    if (empresaId) {
      const [otras] = await dbConn.query(
        `SELECT COUNT(*) AS total FROM Usuario_Empresas
         WHERE UE_usuario = ? AND UE_empresa <> ?`,
        [id, empresaId]
      );
      if (otras[0].total > 0) {
        const error = new Error('El usuario pertenece a otras empresas; solo un administrador global puede eliminarlo');
        error.status = 409;
        throw error;
      }
    }

    const [result] = await dbConn.query('DELETE FROM Usuario WHERE Usu_id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * Verifica si un usuario pertenece a una empresa.
   */
  async perteneceAempresa(usuarioId, empresaId, connection = null) {
    const dbConn = connection || db;
    const [rows] = await dbConn.query(
      'SELECT 1 FROM Usuario_Empresas WHERE UE_usuario = ? AND UE_empresa = ? LIMIT 1',
      [usuarioId, empresaId]
    );
    return rows.length > 0;
  }
}

module.exports = new UsuariosRepository();