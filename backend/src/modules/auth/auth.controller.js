const authService = require('./auth.service');
const { success } = require('../../utils/response');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return success(res, result, 'Login exitoso');
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    return success(res, result, 'Token renovado');
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    return success(res, null, 'Sesión cerrada');
  } catch (err) { next(err); }
};