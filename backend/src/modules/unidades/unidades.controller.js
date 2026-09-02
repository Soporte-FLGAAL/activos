const { paginate } = require('../../utils/pagination');
const unidadesService = require('./unidades.service');
const { success } = require('../../utils/response');

exports.listar = async (req, res, next) => {
  try {
    const filtros = {
      empresaId: req.query.empresaId || null,
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
    const unidad = await unidadesService.obtener(req.params.id);
    return success(res, unidad, 'Unidad encontrada');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nueva = await unidadesService.crear(req.body);
    return success(res, nueva, 'Unidad creada', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizada = await unidadesService.actualizar(req.params.id, req.body);
    return success(res, actualizada, 'Unidad actualizada');
  } catch (err) { next(err); }
};

exports.actualizarCampo = async (req, res, next) => {
  try {
    const actualizada = await unidadesService.actualizarCampo(req.params.id, req.body);
    return success(res, actualizada, 'Campo actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await unidadesService.eliminar(req.params.id);
    return success(res, null, 'Unidad eliminada');
  } catch (err) { next(err); }
};

exports.totalPorEmpresa = async (req, res, next) => {
  try {
    const { empresaId } = req.params;
    const total = await unidadesService.totalPorEmpresa(empresaId);
    return success(res, { total }, 'Total de unidades');
  } catch (err) { next(err); }
};

exports.resumenPorEmpresa = async (req, res, next) => {
  try {
    const { empresaId } = req.params;
    const resumen = await unidadesService.resumenPorEmpresa(empresaId);
    return success(res, resumen, 'Resumen de unidades');
  } catch (err) { next(err); }
};