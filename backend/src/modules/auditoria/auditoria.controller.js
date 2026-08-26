const auditoriaService = require('./auditoria.service');
const { success } = require('../../utils/response');

exports.listar = async (req, res, next) => {
  try {
    const movimientos = await auditoriaService.listar(req.query);
    return success(res, movimientos, 'Movimientos obtenidos');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const movimiento = await auditoriaService.obtener(req.params.id);
    return success(res, movimiento, 'Movimiento encontrado');
  } catch (err) { next(err); }
};