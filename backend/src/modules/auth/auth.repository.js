const db = require('../../config/database');

class AuthRepository {
  async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM Usuario WHERE Usu_correo = ?', [email]);
    return rows[0] || null;
  }

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM Usuario WHERE Usu_id = ?', [id]);
    return rows[0] || null;
  }

  async updateLastAccess(id) {
    await db.query('UPDATE Usuario SET Usu_ultimo_acceso = NOW() WHERE Usu_id = ?', [id]);
  }

  async guardarRefreshToken(usuarioId, token, expiracion) {
    await db.query(
      'INSERT INTO RefreshTokens (RT_usuario, RT_token, RT_expiracion) VALUES (?, ?, ?)',
      [usuarioId, token, expiracion]
    );
  }

  async findRefreshToken(token) {
    const [rows] = await db.query('SELECT * FROM RefreshTokens WHERE RT_token = ?', [token]);
    return rows[0] || null;
  }

  async revocarRefreshToken(token) {
    await db.query('DELETE FROM RefreshTokens WHERE RT_token = ?', [token]);
  }

  async revocarTodosDeUsuario(usuarioId) {
    await db.query('DELETE FROM RefreshTokens WHERE RT_usuario = ?', [usuarioId]);
  }
}

module.exports = new AuthRepository();