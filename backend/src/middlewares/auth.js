const { verifyAccessToken } = require('../utils/jwt');
const { error } = require('../utils/response');
const authRepository = require('../modules/auth/auth.repository');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'No se proporcionó token de autenticación', 401);
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return error(res, 'Token inválido o expirado', 401);
    }

    // Verificar que la cuenta siga activa
    const user = await authRepository.findById(decoded.userId);
    if (!user) {
      return error(res, 'Usuario no encontrado', 401);
    }
    if (user.Usu_status !== 'ACTIVO') {
      return error(res, 'Cuenta inactiva', 401);
    }

    req.user = decoded;
    next();
  } catch (err) {
    next(err);
  }
};