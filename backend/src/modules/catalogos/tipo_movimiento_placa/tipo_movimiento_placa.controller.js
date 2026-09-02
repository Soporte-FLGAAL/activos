const tipoMovimientoPlacaService = require('./tipo_movimiento_placa.service');
const { success } = require('../../../utils/response');
const { paginate } = require('../../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    const resultado = await paginate(
      (f) => tipoMovimientoPlacaService.listar(f),
      (f) => tipoMovimientoPlacaService.contar(f),
      req.query,
      {}
    );
    return success(res, resultado, 'Tipos de movimientos obtenidos');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const item = await tipoMovimientoPlacaService.obtener(req.params.id);
    return success(res, item, 'Tipo de movimiento encontrado');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nuevo = await tipoMovimientoPlacaService.crear(req.body, req.user.userId);
    return success(res, nuevo, 'Tipo de movimiento creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await tipoMovimientoPlacaService.actualizar(req.params.id, req.body, req.user.userId);
    return success(res, actualizado, 'Tipo de movimiento actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await tipoMovimientoPlacaService.eliminar(req.params.id, req.user.userId);
    return success(res, null, 'Tipo de movimiento eliminado');
  } catch (err) { next(err); }
};