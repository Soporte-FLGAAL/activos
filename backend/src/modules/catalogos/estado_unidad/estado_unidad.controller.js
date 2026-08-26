const estadoUnidadService = require('./estado_unidad.service');
const { success } = require('../../../utils/response');

exports.listar = async (req, res, next) => {
  try {
    const items = await estadoUnidadService.listar();
    return success(res, items, 'Estados de unidad obtenidos');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const item = await estadoUnidadService.obtener(req.params.id);
    return success(res, item, 'Estado de unidad encontrado');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nuevo = await estadoUnidadService.crear(req.body);
    return success(res, nuevo, 'Estado de unidad creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await estadoUnidadService.actualizar(req.params.id, req.body);
    return success(res, actualizado, 'Estado de unidad actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await estadoUnidadService.eliminar(req.params.id);
    return success(res, null, 'Estado de unidad eliminado');
  } catch (err) { next(err); }
};