const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const authRepository = require('./auth.repository');
const { comparePassword } = require('../../utils/password');

class AuthService {
  _credencialesInvalidas = () => {
      const error = new Error('Credenciales inválidas');
      error.status = 401;
      return error;
  };

  async login(email, password) {
    const user = await authRepository.findByEmail(email);
    
    if (!user) throw this._credencialesInvalidas();

    if (user.Usu_status !== 'ACTIVO') {
    // Mismo mensaje para no filtrar información
      throw this._credencialesInvalidas();
    }

    const valid = await comparePassword(password, user.Usu_password);
    if (!valid) throw this._credencialesInvalidas();

    await authRepository.updateLastAccess(user.Usu_id);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Guardar refresh token en BD con expiración (7 días)
    const expiracion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await authRepository.guardarRefreshToken(user.Usu_id, refreshToken, expiracion);

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
    if (!user || user.Usu_status !== 'ACTIVO') {
      const error = new Error('Refresh token inválido');
      error.status = 401;
      throw error;
    }

    // Verificar que exista en BD y no esté expirado
    const storedToken = await authRepository.findRefreshToken(token);
    if (!storedToken || new Date(storedToken.RT_expiracion) < new Date()) {
      throw new Error('Refresh token no válido o expirado');
    }

    if (new Date(stored.expira_en) < new Date()) {
      // *** ESTE era el caso que faltaba: 401, no 500 ***
      await authRepository.revokeRefreshToken(token);
      const error = new Error('Refresh token expirado');
      error.status = 401;
      throw error;
    }

    // Revocar token anterior
    await authRepository.revocarRefreshToken(token);

    // Generar nuevos tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await authRepository.guardarRefreshToken(user.Usu_id, refreshToken, expiracion);

    return { accessToken, refreshToken };
  }

  async logout(token) {
   try {
      await authRepository.revocarRefreshToken(token);
      return true;
    } catch (err) {
      const error = new Error('No se pudo cerrar sesión');
      error.status = 500;
      throw error;
    }
  }
}

module.exports = new AuthService();