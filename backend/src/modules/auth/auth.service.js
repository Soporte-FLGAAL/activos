const authRepository = require('./auth.repository');
const { comparePassword } = require('../../utils/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/jwt');

class AuthService {
  async login(email, password) {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      const error = new Error('Credenciales inválidas');
      error.status = 401;
      throw error;
    }
    const valid = await comparePassword(password, user.Usu_password);
    if (!valid) {
      const error = new Error('Credenciales inválidas');
      error.status = 401;
      throw error;
    }
    await authRepository.updateLastAccess(user.Usu_id);
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    return {
      user: { id: user.Usu_id, email: user.Usu_correo, nombres: `${user.Usu_nombres} ${user.Usu_ap_paterno}` },
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
    const user = await authRepository.findById(decoded.userId);
    if (!user) {
      const error = new Error('Usuario no encontrado o inactivo');
      error.status = 401;
      throw error;
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    return { accessToken, refreshToken };
  }
}

module.exports = new AuthService();