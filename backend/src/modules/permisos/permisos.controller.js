const permisosService = require('./permisos.service');
const { success } = require('../../utils/response');
const { paginate } = require('../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    const resultado = await paginate(
      (f) => permisosService.listar(f),
      (f) => permisosService.contar(f),
      req.query,
      {}
    );
    return success(res, resultado, 'Permisos obtenidos');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const permiso = await permisosService.obtener(req.params.id);
    return success(res, permiso, 'Permiso encontrado');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nuevo = await permisosService.crear(req.body, req.user.userId);
    return success(res, nuevo, 'Permiso creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await permisosService.actualizar(req.params.id, req.body, req.user.userId);
    return success(res, actualizado, 'Permiso actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await permisosService.eliminar(req.params.id, req.user.userId);
    return success(res, null, 'Permiso eliminado');
  } catch (err) { next(err); }
};