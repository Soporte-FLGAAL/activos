const db = require('../../config/database');

class UsuarioEmpresasRepository {
  async findByUsuarioAndEmpresa(usuarioId, empresaId) {
    const [rows] = await db.query(
      'SELECT * FROM Usuario_Empresas WHERE UE_usuario = ? AND UE_empresa = ?',
      [usuarioId, empresaId]
    );
    return rows[0] || null;
  }

  async findAllByUsuario(usuarioId) {
    const [rows] = await db.query(
      `SELECT ue.*, e.Emp_nombre, r.Rol_nombre 
       FROM Usuario_Empresas ue
       JOIN Empresas e ON ue.UE_empresa = e.Emp_id
       JOIN Roles r ON ue.UE_rol = r.Rol_id
       WHERE ue.UE_usuario = ?`,
      [usuarioId]
    );
    return rows;
  }

  async findAllByEmpresa(empresaId) {
    const [rows] = await db.query(
      `SELECT ue.*, u.Usu_nombres, u.Usu_ap_paterno, u.Usu_correo, r.Rol_nombre
       FROM Usuario_Empresas ue
       JOIN Usuario u ON ue.UE_usuario = u.Usu_id
       JOIN Roles r ON ue.UE_rol = r.Rol_id
       WHERE ue.UE_empresa = ?`,
      [empresaId]
    );
    return rows;
  }

  async asignar(data) {
    await db.query('INSERT INTO Usuario_Empresas SET ?', data);
    return this.findByUsuarioAndEmpresa(data.UE_usuario, data.UE_empresa);
  }

  async actualizarRol(usuarioId, empresaId, rolId) {
    await db.query(
      'UPDATE Usuario_Empresas SET UE_rol = ? WHERE UE_usuario = ? AND UE_empresa = ?',
      [rolId, usuarioId, empresaId]
    );
    return this.findByUsuarioAndEmpresa(usuarioId, empresaId);
  }

  async eliminar(usuarioId, empresaId) {
    const [result] = await db.query(
      'DELETE FROM Usuario_Empresas WHERE UE_usuario = ? AND UE_empresa = ?',
      [usuarioId, empresaId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = new UsuarioEmpresasRepository();