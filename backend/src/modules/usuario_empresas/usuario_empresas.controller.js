const usuarioEmpresasService = require('./usuario_empresas.service');
const { success } = require('../../utils/response');

exports.listarPorUsuario = async (req, res, next) => {
  try {
    const asignaciones = await usuarioEmpresasService.listarPorUsuario(req.params.usuarioId);
    return success(res, asignaciones, 'Asignaciones del usuario');
  } catch (err) { next(err); }
};

exports.listarPorEmpresa = async (req, res, next) => {
  try {
    const asignaciones = await usuarioEmpresasService.listarPorEmpresa(req.params.empresaId);
    return success(res, asignaciones, 'Asignaciones de la empresa');
  } catch (err) { next(err); }
};

exports.asignar = async (req, res, next) => {
  try {
    const nueva = await usuarioEmpresasService.asignar(req.body);
    return success(res, nueva, 'Usuario asignado a empresa', 201);
  } catch (err) { next(err); }
};

exports.actualizarRol = async (req, res, next) => {
  try {
    const { usuarioId, empresaId } = req.params;
    const { rolId } = req.body;
    const actualizado = await usuarioEmpresasService.actualizarRol(usuarioId, empresaId, rolId);
    return success(res, actualizado, 'Rol actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    const { usuarioId, empresaId } = req.params;
    await usuarioEmpresasService.eliminar(usuarioId, empresaId);
    return success(res, null, 'Asignación eliminada');
  } catch (err) { next(err); }
};