const db = require('../../config/database');

class AuthRepository {
  async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM Usuario WHERE Usu_correo = ?', [email]);
    return rows[0] || null;
  }

  async findById(id, connection = null) {
    const dbConn = connection || db;
    const [rows] = await dbConn.query('SELECT * FROM Usuario WHERE Usu_id = ?', [id]);
    return rows[0] || null;
  }

  async findEmpresasByUsuario(usuarioId) {
    const [rows] = await db.query(
      `SELECT
        e.Emp_id,
        e.Emp_nombre,
        e.Emp_nombre_corto,
        r.Rol_id,
        r.Rol_nombre
      FROM Usuario_Empresas ue
      JOIN Empresas e ON ue.UE_empresa = e.Emp_id
      JOIN Roles r ON ue.UE_rol = r.Rol_id
      WHERE ue.UE_usuario = ?
      ORDER BY e.Emp_nombre`,
      [usuarioId]
    );
    return rows;
  }

  async findRefreshTokenForUpdate(token, connection) {
    if (!connection) {
      throw new Error('findRefreshTokenForUpdate requiere una conexión de transacción');
    }
    const [rows] = await connection.query(
      'SELECT * FROM RefreshTokens WHERE RT_token = ? LIMIT 1 FOR UPDATE',
      [token]
    );
    return rows[0] || null;
  }
  
  async updateLastAccess(id, connection = null) {
    const dbConn = connection || db;
    await dbConn.query('UPDATE Usuario SET Usu_ultimo_acceso = NOW() WHERE Usu_id = ?', [id]);
  }

  async guardarRefreshToken(usuarioId, token, expiracion, connection = null) {
    const dbConn = connection || db;
    await dbConn.query(
      'INSERT INTO RefreshTokens (RT_usuario, RT_token, RT_expiracion) VALUES (?, ?, ?)',
      [usuarioId, token, expiracion]
    );
  }

  async findRefreshToken(token) {
    const [rows] = await db.query('SELECT * FROM RefreshTokens WHERE RT_token = ?', [token]);
    return rows[0] || null;
  }

  async revocarRefreshToken(token, connection = null) {
    const dbConn = connection || db;
    await dbConn.query('DELETE FROM RefreshTokens WHERE RT_token = ?', [token]);
  }

  async revocarTodosDeUsuario(usuarioId, connection = null) {
    const dbConn = connection || db;
    const [result] = await dbConn.query('DELETE FROM RefreshTokens WHERE RT_usuario = ?', [usuarioId]);
    return result.affectedRows;
  }
}

module.exports = new AuthRepository();