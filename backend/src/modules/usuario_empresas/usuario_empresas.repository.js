const db = require('../../config/database');

class UsuarioEmpresasRepository {
  // Obtener todas las asignaciones con información de usuario, empresa y rol
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
}

module.exports = new UsuarioEmpresasRepository();