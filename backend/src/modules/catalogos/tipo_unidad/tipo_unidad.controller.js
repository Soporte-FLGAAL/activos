const tipoUnidadService = require('./tipo_unidad.service');
const { success } = require('../../../utils/response');

exports.listar = async (req, res, next) => {
  try {
    const items = await tipoUnidadService.listar();
    return success(res, items, 'Tipos de unidad obtenidos');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const item = await tipoUnidadService.obtener(req.params.id);
    return success(res, item, 'Tipo de unidad encontrado');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nuevo = await tipoUnidadService.crear(req.body);
    return success(res, nuevo, 'Tipo de unidad creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await tipoUnidadService.actualizar(req.params.id, req.body);
    return success(res, actualizado, 'Tipo de unidad actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await tipoUnidadService.eliminar(req.params.id);
    return success(res, null, 'Tipo de unidad eliminado');
  } catch (err) { next(err); }
};