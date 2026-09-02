const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const authRepository = require('./auth.repository');
const { comparePassword } = require('../../utils/password');

class AuthService {
  async login(email, password) {
    const user = await authRepository.findByEmail(email);
    if (!user) throw new Error('Credenciales inválidas');
    const valid = await comparePassword(password, user.Usu_password);
    if (!valid) throw new Error('Credenciales inválidas');

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
      throw new Error('Refresh token inválido');
    }

    // Verificar que exista en BD y no esté expirado
    const storedToken = await authRepository.findRefreshToken(token);
    if (!storedToken || new Date(storedToken.RT_expiracion) < new Date()) {
      throw new Error('Refresh token no válido o expirado');
    }

    const user = await authRepository.findById(decoded.userId);
    if (!user) throw new Error('Usuario no encontrado');

    // Revocar token anterior
    await authRepository.revocarRefreshToken(token);

    // Generar nuevos tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const expiracion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await authRepository.guardarRefreshToken(user.Usu_id, refreshToken, expiracion);

    return { accessToken, refreshToken };
  }

  async logout(refreshToken) {
    await authRepository.revocarRefreshToken(refreshToken);
  }
}