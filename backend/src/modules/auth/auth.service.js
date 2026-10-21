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
    const noAutorizado = (mensaje = 'Refresh token inválido') => {
      const error = new Error(mensaje);
      error.status = 401;
      return error;
    };

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      throw noAutorizado();
    }

    const user = await authRepository.findById(decoded.userId);
    if (!user || user.Usu_status !== 'ACTIVO') {
      throw noAutorizado();
    }

    // Verificar que exista en BD y no esté expirado
    const storedToken = await authRepository.findRefreshToken(token);
    
    if (!storedToken) {
      throw noAutorizado();;
    }

    if (new Date(storedToken.RT_expiracion) < new Date()) {
      // Es un token que existía pero ya venció → revocarlo para limpiar
      await authRepository.revocarRefreshToken(token);
      throw noAutorizado('Refresh token expirado');
    }

    // Revocar token anterior
    await authRepository.revocarRefreshToken(token);

    // Generar nuevos tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const decodedNew = jwt.decode(refreshToken);
    const expiracion = new Date(decodedNew.exp * 1000);
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