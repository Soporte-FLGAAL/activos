const usuarioEmpresasService = require('./usuario_empresas.service');
const { success } = require('../../utils/response');
const { paginate } = require('../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    const filtros = {
      usuarioId: req.query.usuarioId || null,
      empresaId: req.query.empresaId || null,
    };
    const resultado = await paginate(
      (f) => usuarioEmpresasService.listar(f),
      (f) => usuarioEmpresasService.contar(f),
      req.query,
      filtros
    );
    return success(res, resultado, 'Asignaciones usuario-empresa obtenidas');
  } catch (err) { next(err); }
};

exports.asignar = async (req, res, next) => {
  try {
    await usuarioEmpresasService.asignar(
      req.body,
      req.user.userId,
      req.esAdminGlobal   
    );
    return success(res, null, 'Usuario asignado a empresa', 201);
  } catch (err) { next(err); }
};

exports.actualizarRol = async (req, res, next) => {
  try {
    await usuarioEmpresasService.actualizarRol(
      req.body,
      req.user.userId,
      req.esAdminGlobal   
    );
    return success(res, null, 'Rol actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    const { usuarioId, empresaId } = req.params;
    await usuarioEmpresasService.eliminar(
      usuarioId,
      empresaId,
      req.user.userId,
      req.esAdminGlobal   
    );
    return success(res, null, 'Asignación eliminada');
  } catch (err) { next(err); }
};