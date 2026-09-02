const estadoUnidadService = require('./estado_unidad.service');
const { success } = require('../../../utils/response');
const { paginate } = require('../../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    const resultado = await paginate(
      (f) => estadoUnidadService.listar(f),
      (f) => estadoUnidadService.contar(f),
      req.query,
      {}
    );
    return success(res, resultado, 'Estados de unidad obtenidos');
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
    const nuevo = await estadoUnidadService.crear(req.body, req.user.userId);
    return success(res, nuevo, 'Estado de unidad creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await estadoUnidadService.actualizar(req.params.id, req.body, req.user.userId);
    return success(res, actualizado, 'Estado de unidad actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await estadoUnidadService.eliminar(req.params.id, req.user.userId);
    return success(res, null, 'Estado de unidad eliminado');
  } catch (err) { next(err); }
};