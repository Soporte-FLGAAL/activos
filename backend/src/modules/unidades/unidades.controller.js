const { paginate } = require('../../utils/pagination');
const unidadesService = require('./unidades.service');
const { success, error } = require('../../utils/response');

exports.listar = async (req, res, next) => {
  try {
    // Admin global puede filtrar por cualquier empresa; usuario normal queda atado a la suya
    const empresaFiltro = req.esAdminGlobal
      ? (req.query.empresaId || null)
      : req.empresaId;

    const filtros = {
      empresaId: empresaFiltro, // <-- antes estaba req.query.empresaId || null (BUG)
      tipoId: req.query.tipoId || null,
      combustibleId: req.query.combustibleId || null,
      ejes: req.query.ejes || null,
      status: req.query.status || null,
      search: req.query.search || null,
    };

    const resultado = await paginate(
      (f) => unidadesService.listar(f),
      (f) => unidadesService.contar(f),
      req.query,
      filtros
    );
    return success(res, resultado, 'Unidades obtenidas');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const empresaId = req.esAdminGlobal ? null : req.empresaId;
    const unidad = await unidadesService.obtener(req.params.id, empresaId);
    return success(res, unidad, 'Unidad encontrada');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nueva = await unidadesService.crear(req.body, req.user.userId, req.empresaId, req.esAdminGlobal);
    return success(res, nueva, 'Unidad creada', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const empresaId = req.esAdminGlobal ? null : req.empresaId;
    const actualizada = await unidadesService.actualizar(req.params.id, req.body, req.user.userId, empresaId);
    return success(res, actualizada, 'Unidad actualizada');
  } catch (err) { next(err); }
};

exports.actualizarCampo = async (req, res, next) => {
  try {
    const empresaId = req.esAdminGlobal ? null : req.empresaId;
    const actualizada = await unidadesService.actualizarCampo(req.params.id, req.body, req.user.userId, empresaId);
    return success(res, actualizada, 'Campo actualizado');
  } catch (err) { next(err); }
};

exports.cambiarEmpresa = async (req, res, next) => {
  try {
    if (!req.esAdminGlobal) {
      return error(res, 'Solo un administrador global puede cambiar la empresa de una unidad', 403);
    }
    const actualizada = await unidadesService.cambiarEmpresa(
      req.params.id, req.body, req.user.userId
    );
    return success(res, actualizada, 'Empresa de la unidad actualizada');
  } catch (err) { next(err); }
};

exports.cambiarPropietario = async (req, res, next) => {
  try {
    if (!req.esAdminGlobal) {
      return error(res, 'Solo un administrador global puede cambiar el propietario de una unidad', 403);
    }
    const actualizada = await unidadesService.cambiarPropietario(
      req.params.id,
      req.body,
      req.user.userId
    );
    return success(res, actualizada, 'Propietario de la unidad actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    const empresaId = req.esAdminGlobal ? null : req.empresaId;
    await unidadesService.eliminar(req.params.id, req.user.userId, empresaId);
    return success(res, null, 'Unidad eliminada');
  } catch (err) { next(err); }
};

exports.totalPorEmpresa = async (req, res, next) => {
  try {
    if (!req.esAdminGlobal && Number(req.params.empresaId) !== Number(req.empresaId)) {
      return error(res, 'No tiene acceso a la empresa especificada', 403);
    }
    const { empresaId } = req.params;
    const total = await unidadesService.totalPorEmpresa(empresaId);
    return success(res, { total }, 'Total de unidades');
  } catch (err) { next(err); }
};

exports.resumenPorEmpresa = async (req, res, next) => {
  try {
    if (!req.esAdminGlobal && Number(req.params.empresaId) !== Number(req.empresaId)) {
      return error(res, 'No tiene acceso a la empresa especificada', 403);
    }
    const { empresaId } = req.params;
    const resumen = await unidadesService.resumenPorEmpresa(empresaId);
    return success(res, resumen, 'Resumen de unidades');
  } catch (err) { next(err); }
};