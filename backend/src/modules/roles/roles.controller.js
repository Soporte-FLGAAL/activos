const rolesService = require('./roles.service');
const { success } = require('../../utils/response');
const { paginate } = require('../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    const resultado = await paginate(
      (f) => rolesService.listar(f),
      (f) => rolesService.contar(f),
      req.query,
      {}
    );
    return success(res, resultado, 'Roles obtenidos');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const rol = await rolesService.obtener(req.params.id);
    return success(res, rol, 'Rol encontrado');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nuevo = await rolesService.crear(req.body, req.user.userId);
    return success(res, nuevo, 'Rol creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await rolesService.actualizar(req.params.id, req.body, req.user.userId);
    return success(res, actualizado, 'Rol actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await rolesService.eliminar(req.params.id, req.user.userId);
    return success(res, null, 'Rol eliminado');
  } catch (err) { next(err); }
};