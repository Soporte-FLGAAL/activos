const usuariosService = require('./usuarios.service');
const { success } = require('../../utils/response');
const { paginate } = require('../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    // ADMIN_GLOBAL ve todos; usuario normal solo los de su empresa
    const empresaFiltro = req.esAdminGlobal
      ? (req.query.empresaId || null)
      : req.empresaId;

    const filtros = { empresaId: empresaFiltro };

    const resultado = await paginate(
      (f) => usuariosService.listar(f),
      (f) => usuariosService.contar(f),
      req.query,
      filtros 
    );
    return success(res, resultado, 'Usuarios obtenidos');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const empresaId = req.esAdminGlobal ? null : req.empresaId;
    const usuario = await usuariosService.obtener(req.params.id, empresaId);
    return success(res, usuario, 'Usuario encontrado');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nuevo = await usuariosService.crear(req.body, req.user.userId);
    return success(res, nuevo, 'Usuario creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const empresaId = req.esAdminGlobal ? null : req.empresaId;
    const actualizado = await usuariosService.actualizar(req.params.id, req.body, req.user.userId, empresaId);
    return success(res, actualizado, 'Usuario actualizado');
  } catch (err) { next(err); }
};

exports.cambiarPasswordPropio = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    await usuariosService.cambiarPasswordPropio(userId, req.body, req.user.userId);
    return success(res, null, 'Contraseña actualizada correctamente');
  } catch (err) { next(err); }
};

exports.adminCambiarPassword = async (req, res, next) => {
  try {
    const empresaId = req.esAdminGlobal ? null : req.empresaId;
    await usuariosService.adminCambiarPassword(req.params.id, req.body, req.user.userId, empresaId);
    return success(res, null, 'Contraseña actualizada por administrador');
  } catch (err) { next(err); }
};

/**
 * PATCH /usuarios/:id/desactivar
 * Desactiva (soft delete). Permitido para ADMIN de la empresa o ADMIN_GLOBAL.
 */
exports.desactivar = async (req, res, next) => {
  try {
    const empresaId = req.esAdminGlobal ? null : req.empresaId;
    const desactivado = await usuariosService.desactivar(req.params.id, req.user.userId, empresaId);
    return success(res, desactivado, 'Usuario desactivado');
  } catch (err) { next(err); }
};

/**
 * DELETE /usuarios/:id
 * Eliminación física. Solo ADMIN_GLOBAL.
 */
exports.eliminarDefinitivo = async (req, res, next) => {
  try {
    if (!req.esAdminGlobal) {
      return error(res, 'Solo un administrador global puede eliminar usuarios definitivamente', 403);
    }
    await usuariosService.eliminarDefinitivo(req.params.id, req.user.userId);
    return success(res, null, 'Usuario eliminado definitivamente');
  } catch (err) { next(err); }
};