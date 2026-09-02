const detallePlacasService = require('./detalle_placas.service');
const { success } = require('../../utils/response');
const { paginate } = require('../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    const filtros = {
      placasId: req.query.placasId || null,
    };
    const resultado = await paginate(
      (f) => detallePlacasService.listar(f),
      (f) => detallePlacasService.contar(f),
      req.query,
      filtros
    );
    return success(res, resultado, 'Detalles de placas obtenidos');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const detalle = await detallePlacasService.obtener(req.params.id);
    return success(res, detalle, 'Detalle encontrado');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nuevo = await detallePlacasService.crear(req.body, req.user.userId);
    return success(res, nuevo, 'Detalle creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await detallePlacasService.actualizar(req.params.id, req.body, req.user.userId);
    return success(res, actualizado, 'Detalle actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await detallePlacasService.eliminar(req.params.id, req.user.userId);
    return success(res, null, 'Detalle eliminado');
  } catch (err) { next(err); }
};