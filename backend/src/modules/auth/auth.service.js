const db = require('../../config/database');
const { comparePassword } = require('../../utils/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/jwt');

class AuthService {
  async login(email, password) {
    const [rows] = await db.query(
      'SELECT * FROM Usuario WHERE Usu_correo = ? AND Usu_status = "ACTIVO"',
      [email]
    );
    if (rows.length === 0) {
      const error = new Error('Credenciales inválidas');
      error.status = 401;
      throw error;
    }
    const user = rows[0];
    const valid = await comparePassword(password, user.Usu_password);
    if (!valid) {
      const error = new Error('Credenciales inválidas');
      error.status = 401;
      throw error;
    }

    await db.query('UPDATE Usuario SET Usu_ultimo_acceso = NOW() WHERE Usu_id = ?', [user.Usu_id]);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    return {
      user: { id: user.Usu_id, email: user.Usu_correo, nombres: user.Usu_nombres },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token) {
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      const error = new Error('Refresh token inválido');
      error.status = 401;
      throw error;
    }
    const [rows] = await db.query('SELECT * FROM Usuario WHERE Usu_id = ? AND Usu_status = "ACTIVO"', [decoded.userId]);
    if (rows.length === 0) {
      const error = new Error('Usuario no encontrado o inactivo');
      error.status = 401;
      throw error;
    }
    const user = rows[0];
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    return { accessToken, refreshToken };
  }
}

module.exports = new AuthService();