const rolesService = require('./roles.service');
const { success } = require('../../utils/response');

exports.listar = async (req, res, next) => {
  try {
    const roles = await rolesService.listar();
    return success(res, roles, 'Roles obtenidos');
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
    const nuevo = await rolesService.crear(req.body);
    return success(res, nuevo, 'Rol creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await rolesService.actualizar(req.params.id, req.body);
    return success(res, actualizado, 'Rol actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await rolesService.eliminar(req.params.id);
    return success(res, null, 'Rol eliminado');
  } catch (err) { next(err); }
};