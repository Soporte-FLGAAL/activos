const { verifyAccessToken } = require('../utils/jwt');
const { error } = require('../utils/response');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'No se proporcionó token de autenticación', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    const user = await authRepository.findById(decoded.userId);
    if (!user || user.Usu_status !== 'ACTIVO') {
      return error(res, 'Cuenta inactiva o usuario no encontrado', 401);
    }
    
    req.user = decoded;
    next();
  } catch (err) {
    return error(res, 'Token inválido o expirado', 401);
  }
};