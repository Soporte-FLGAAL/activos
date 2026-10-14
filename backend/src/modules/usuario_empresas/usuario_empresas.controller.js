const usuarioEmpresasService = require('./usuario_empresas.service');
const { success } = require('../../utils/response');
const { paginate } = require('../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    const empresaFiltro = req.esAdminGlobal
      ? (req.query.empresaId || null)
      : req.empresaId;

    const filtros = {
      empresaId: empresaFiltro,
      usuarioId: req.query.usuarioId || null,
    };

    const resultado = await paginate(
      (f) => usuarioEmpresasService.listar(f, req.esAdminGlobal),
      (f) => usuarioEmpresasService.contar(f, req.esAdminGlobal),
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
      req.esAdminGlobal,
      req.empresaId   
    );
    return success(res, null, 'Usuario asignado a empresa', 201);
  } catch (err) { next(err); }
};

exports.actualizarRol = async (req, res, next) => {
  try {
    await usuarioEmpresasService.actualizarRol(
      req.body,
      req.user.userId,
      req.esAdminGlobal,
      req.empresaId   
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
      req.esAdminGlobal,
      req.empresaId   
    );
    return success(res, null, 'Asignación eliminada');
  } catch (err) { next(err); }
};