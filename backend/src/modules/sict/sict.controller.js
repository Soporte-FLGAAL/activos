const sictService = require('./sict.service');
const { success } = require('../../utils/response');

exports.listar = async (req, res, next) => {
  try {
    const { unidadId } = req.query;
    const permisos = await sictService.listar(unidadId);
    return success(res, permisos, 'Permisos SICT obtenidos');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const permiso = await sictService.obtener(req.params.id);
    return success(res, permiso, 'Permiso SICT encontrado');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nuevo = await sictService.crear(req.body);
    return success(res, nuevo, 'Permiso SICT creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await sictService.actualizar(req.params.id, req.body);
    return success(res, actualizado, 'Permiso SICT actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await sictService.eliminar(req.params.id);
    return success(res, null, 'Permiso SICT eliminado');
  } catch (err) { next(err); }
};