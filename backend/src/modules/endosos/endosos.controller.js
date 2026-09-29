const endososService = require('./endosos.service');
const { success } = require('../../utils/response');
const { paginate } = require('../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    const empresaFiltro = req.esAdminGlobal ? (req.query.empresaId || null) : req.empresaId;
    const filtros = {
      empresaId: empresaFiltro,
      polizaId: req.query.polizaId || null,
    };
    const resultado = await paginate(
      (f) => endososService.listar(f),
      (f) => endososService.contar(f),
      req.query,
      filtros
    );
    return success(res, resultado, 'Endosos obtenidos');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const empresaId = req.esAdminGlobal ? null : req.empresaId;
    const endoso = await endososService.obtener(req.params.id, empresaId);
    return success(res, endoso, 'Endoso encontrado');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const empresaId = req.esAdminGlobal ? null : req.empresaId;
    const nuevo = await endososService.crear(req.body, req.user.userId, empresaId);
    return success(res, nuevo, 'Endoso creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const empresaId = req.esAdminGlobal ? null : req.empresaId;
    const actualizado = await endososService.actualizar(req.params.id, req.body, req.user.userId, empresaId);
    return success(res, actualizado, 'Endoso actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    const empresaId = req.esAdminGlobal ? null : req.empresaId;
    await endososService.eliminar(req.params.id, req.user.userId, empresaId);
    return success(res, null, 'Endoso eliminado');
  } catch (err) { next(err); }
};