const detallePlacasService = require('./detalle_placas.service');
const { success } = require('../../utils/response');

exports.listar = async (req, res, next) => {
  try {
    const { placasId } = req.query;
    const detalles = await detallePlacasService.listar(placasId);
    return success(res, detalles, 'Detalles de placas obtenidos');
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
    const nuevo = await detallePlacasService.crear(req.body);
    return success(res, nuevo, 'Detalle creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await detallePlacasService.actualizar(req.params.id, req.body);
    return success(res, actualizado, 'Detalle actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await detallePlacasService.eliminar(req.params.id);
    return success(res, null, 'Detalle eliminado');
  } catch (err) { next(err); }
};