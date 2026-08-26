const dobleArticuladoService = require('./doble_articulado.service');
const { success } = require('../../utils/response');

exports.listar = async (req, res, next) => {
  try {
    const { unidadId } = req.query;
    const permisos = await dobleArticuladoService.listar(unidadId);
    return success(res, permisos, 'Permisos obtenidos');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const permiso = await dobleArticuladoService.obtener(req.params.id);
    return success(res, permiso, 'Permiso encontrado');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nuevo = await dobleArticuladoService.crear(req.body);
    return success(res, nuevo, 'Permiso creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await dobleArticuladoService.actualizar(req.params.id, req.body);
    return success(res, actualizado, 'Permiso actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await dobleArticuladoService.eliminar(req.params.id);
    return success(res, null, 'Permiso eliminado');
  } catch (err) { next(err); }
};