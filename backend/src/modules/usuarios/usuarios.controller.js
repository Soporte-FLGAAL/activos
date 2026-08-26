const usuariosService = require('./usuarios.service');
const { success } = require('../../utils/response');

exports.listar = async (req, res, next) => {
  try {
    const usuarios = await usuariosService.listar();
    return success(res, usuarios, 'Usuarios obtenidos');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const usuario = await usuariosService.obtener(req.params.id);
    return success(res, usuario, 'Usuario encontrado');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nuevo = await usuariosService.crear(req.body);
    return success(res, nuevo, 'Usuario creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await usuariosService.actualizar(req.params.id, req.body);
    return success(res, actualizado, 'Usuario actualizado');
  } catch (err) { next(err); }
};

exports.cambiarPasswordPropio = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    await usuariosService.cambiarPasswordPropio(userId, req.body);
    return success(res, null, 'Contraseña actualizada correctamente');
  } catch (err) { next(err); }
};

exports.adminCambiarPassword = async (req, res, next) => {
  try {
    await usuariosService.adminCambiarPassword(req.params.id, req.body);
    return success(res, null, 'Contraseña actualizada por administrador');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await usuariosService.eliminar(req.params.id);
    return success(res, null, 'Usuario eliminado');
  } catch (err) { next(err); }
};