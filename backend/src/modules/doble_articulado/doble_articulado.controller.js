const dobleArticuladoService = require('./doble_articulado.service');
const { success } = require('../../utils/response');
const { paginate } = require('../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    const q = req.validatedQuery || {};
    const empresaFiltro = req.esAdminGlobal ? (q.empresaId || null) : req.empresaId;
    const filtros = { empresaId: empresaFiltro, unidadId: q.unidadId || null };
    const resultado = await paginate(
      (f) => dobleArticuladoService.listar(f),
      (f) => dobleArticuladoService.contar(f),
      req.query,
      filtros
    );
    return success(res, resultado, 'Permisos obtenidos');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const empresaId = req.esAdminGlobal ? null : req.empresaId;
    const permiso = await dobleArticuladoService.obtener(req.params.id, empresaId);
    return success(res, permiso, 'Permiso encontrado');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const empresaId = req.esAdminGlobal ? null : req.empresaId;
    const nuevo = await dobleArticuladoService.crear(req.body, req.user.userId, empresaId);
    return success(res, nuevo, 'Permiso creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const empresaId = req.esAdminGlobal ? null : req.empresaId;
    const actualizado = await dobleArticuladoService.actualizar(req.params.id, req.body, req.user.userId, empresaId);
    return success(res, actualizado, 'Permiso actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    const empresaId = req.esAdminGlobal ? null : req.empresaId;
    await dobleArticuladoService.eliminar(req.params.id, req.user.userId, empresaId);
    return success(res, null, 'Permiso eliminado');
  } catch (err) { next(err); }
};