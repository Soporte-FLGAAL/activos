const sictService = require('./sict.service');
const { success } = require('../../utils/response');
const { paginate } = require('../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    const q = req.validatedQuery || {};
    const empresaFiltro = req.esAdminGlobal ? (q.empresaId || null) : req.empresaId;
    const filtros = { empresaId: empresaFiltro, unidadId: q.unidadId || null };
    const resultado = await paginate(
      (f) => sictService.listar(f),
      (f) => sictService.contar(f),
      req.query,
      filtros
    );
    return success(res, resultado, 'Permisos SICT obtenidos');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const empresaId = req.esAdminGlobal ? null : req.empresaId;
    const permiso = await sictService.obtener(req.params.id, empresaId);
    return success(res, permiso, 'Permiso SICT encontrado');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const empresaId = req.esAdminGlobal ? null : req.empresaId;
    const nuevo = await sictService.crear(req.body, req.user.userId, empresaId);
    return success(res, nuevo, 'Permiso SICT creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const empresaId = req.esAdminGlobal ? null : req.empresaId;
    const actualizado = await sictService.actualizar(req.params.id, req.body, req.user.userId, empresaId);
    return success(res, actualizado, 'Permiso SICT actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    const empresaId = req.esAdminGlobal ? null : req.empresaId;
    await sictService.eliminar(req.params.id, req.user.userId, empresaId);
    return success(res, null, 'Permiso SICT eliminado');
  } catch (err) { next(err); }
};