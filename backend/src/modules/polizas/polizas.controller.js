const polizasService = require('./polizas.service');
const { success } = require('../../utils/response');
const { paginate } = require('../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    // Se pasa empresaId desde req.empresaId (inyectado por setEmpresa)
    const filtros = {
      empresaId: req.empresaId || null,
      unidadId: req.query.unidadId || null,
      aseguradoraId: req.query.aseguradoraId || null,
      vigente: req.query.vigente || null,
    };
    const resultado = await paginate(
      (f) => polizasService.listar(f),
      (f) => polizasService.contar(f),
      req.query,
      filtros
    );
    return success(res, resultado, 'Pólizas obtenidas');
  } catch (err) {
    next(err);
  }
};

exports.obtener = async (req, res, next) => {
  try {
    const poliza = await polizasService.obtener(req.params.id, req.empresaId);
    return success(res, poliza, 'Póliza encontrada');
  } catch (err) {
    next(err);
  }
};

exports.crear = async (req, res, next) => {
  try {
    // En creación simple, la empresa se asigna según la unidad, no se fuerza por ahora
    // Pero se podría validar que la unidad pertenezca a req.empresaId
    const nueva = await polizasService.crear(req.body, req.user.userId);
    return success(res, nueva, 'Póliza creada', 201);
  } catch (err) {
    next(err);
  }
};

exports.crearConEndosos = async (req, res, next) => {
  try {
    const { poliza, endosos } = req.body;
    const polizaId = await polizasService.crearPolizaConEndosos(
      poliza,
      endosos,
      req.user.userId,
      req.empresaId // <-- se pasa empresaId para validar pertenencia de la unidad
    );
    return success(res, { id: polizaId }, 'Póliza con endosos creada', 201);
  } catch (err) {
    next(err);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizada = await polizasService.actualizar(
      req.params.id,
      req.body,
      req.user.userId,
      req.empresaId // <-- se pasa empresaId
    );
    return success(res, actualizada, 'Póliza actualizada');
  } catch (err) {
    next(err);
  }
};

exports.actualizarUrl = async (req, res, next) => {
  try {
    const actualizada = await polizasService.actualizarUrl(
      req.params.id,
      req.body.url,
      req.user.userId,
      req.empresaId // <-- se pasa empresaId
    );
    return success(res, actualizada, 'URL actualizada');
  } catch (err) {
    next(err);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    await polizasService.eliminar(
      req.params.id,
      req.user.userId,
      req.empresaId // <-- se pasa empresaId
    );
    return success(res, null, 'Póliza eliminada');
  } catch (err) {
    next(err);
  }
};