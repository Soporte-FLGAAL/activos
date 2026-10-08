const db = require('../../config/database');

class UsuarioEmpresasRepository {
  async findAll(filters = {}) {
    const { usuarioId, empresaId, limit, offset } = filters;
    let sql = `
      SELECT ue.UE_usuario, ue.UE_empresa, ue.UE_rol,
             u.Usu_nombres, u.Usu_ap_paterno, u.Usu_correo,
             e.Emp_nombre, r.Rol_nombre
      FROM Usuario_Empresas ue
      JOIN Usuario u ON ue.UE_usuario = u.Usu_id
      JOIN Empresas e ON ue.UE_empresa = e.Emp_id
      JOIN Roles r ON ue.UE_rol = r.Rol_id
      WHERE 1=1
    `;
    const params = [];

    if (usuarioId) {
      sql += ' AND ue.UE_usuario = ?';
      params.push(usuarioId);
    }
    if (empresaId) {
      sql += ' AND ue.UE_empresa = ?';
      params.push(empresaId);
    }

    sql += ' ORDER BY ue.UE_usuario, ue.UE_empresa';

    if (limit !== undefined && offset !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }

    const [rows] = await db.query(sql, params);
    return rows;
  }

  async count(filters = {}) {
    const { usuarioId, empresaId } = filters;
    let sql = 'SELECT COUNT(*) AS total FROM Usuario_Empresas WHERE 1=1';
    const params = [];
    if (usuarioId) {
      sql += ' AND UE_usuario = ?';
      params.push(usuarioId);
    }
    if (empresaId) {
      sql += ' AND UE_empresa = ?';
      params.push(empresaId);
    }
    const [rows] = await db.query(sql, params);
    return rows[0].total;
  }

  async findOne(usuarioId, empresaId, connection = null) {
    const dbConn = connection || db;
    const [rows] = await dbConn.query(
      'SELECT * FROM Usuario_Empresas WHERE UE_usuario = ? AND UE_empresa = ?',
      [usuarioId, empresaId]
    );
    return rows[0] || null;
  }

  // En usuario_empresas.repository.js
  async getNombreRol(rolId, connection = null) {
    const dbConn = connection || db;
    const [rows] = await dbConn.query(
      'SELECT Rol_nombre FROM Roles WHERE Rol_id = ?',
      [rolId]
    );
    return rows[0]?.Rol_nombre || null;
  }
  
  async create(asignacion, connection = null) {
    const dbConn = connection || db;
    await dbConn.query(
      'INSERT INTO Usuario_Empresas (UE_usuario, UE_empresa, UE_rol) VALUES (?, ?, ?)',
      [asignacion.usuarioId, asignacion.empresaId, asignacion.rolId]
    );
  }

  async updateRol(usuarioId, empresaId, rolId, connection = null) {
    const dbConn = connection || db;
    await dbConn.query(
      'UPDATE Usuario_Empresas SET UE_rol = ? WHERE UE_usuario = ? AND UE_empresa = ?',
      [rolId, usuarioId, empresaId]
    );
  }

  async delete(usuarioId, empresaId, connection = null) {
    const dbConn = connection || db;
    await dbConn.query(
      'DELETE FROM Usuario_Empresas WHERE UE_usuario = ? AND UE_empresa = ?',
      [usuarioId, empresaId]
    );
  }

  /**
   * Cuenta cuántas asignaciones tiene un usuario con un rol específico (por nombre).
   * Útil para validar lock-out de ADMIN_GLOBAL.
   */
  async countByUsuarioAndRolNombre(usuarioId, rolNombre, connection = null) {
    const dbConn = connection || db;
    const [rows] = await dbConn.query(
      `SELECT COUNT(*) AS total
       FROM Usuario_Empresas ue
       JOIN Roles r ON ue.UE_rol = r.Rol_id
       WHERE ue.UE_usuario = ? AND r.Rol_nombre = ?`,
      [usuarioId, rolNombre]
    );
    return rows[0].total;
  }
}

module.exports = new UsuarioEmpresasRepository();