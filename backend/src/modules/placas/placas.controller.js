const placasService = require('./placas.service');
const { success } = require('../../utils/response');
const { paginate } = require('../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    const filtros = {
      empresaId: req.empresaId || null,
    };
    const resultado = await paginate(
      (f) => placasService.listar(f),
      (f) => placasService.contar(f),
      req.query,
      filtros
    );
    return success(res, resultado, 'Placas obtenidas');
  } catch (err) {
    next(err);
  }
};

exports.obtener = async (req, res, next) => {
  try {
    const placa = await placasService.obtener(req.params.id, req.empresaId);
    return success(res, placa, 'Placa encontrada');
  } catch (err) {
    next(err);
  }
};

exports.crear = async (req, res, next) => {
  try {
    // En creación, se asume que empresaActualId viene en el body
    // Podríamos forzar que sea req.empresaId si queremos restringir
    const nueva = await placasService.crear(req.body, req.user.userId, req.empresaId, req.esAdminGlobal);
    return success(res, nueva, 'Placa creada', 201);
  } catch (err) {
    next(err);
  }
};

exports.actualizarConMovimiento = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { placa, movimiento } = req.body;
    const resultado = await placasService.actualizarPlacaConMovimiento(
      id,
      placa,
      movimiento,
      req.user.userId,
      req.esAdminGlobal ? null : req.empresaId
    );
    return success(res, resultado, 'Placa actualizada con movimiento');
  } catch (err) {
    next(err);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const empresaId = req.esAdminGlobal ? null : req.empresaId;
    const actualizada = await placasService.actualizar(
      req.params.id,
      req.body,
      req.user.userId,
      empresaId 
    );
    return success(res, actualizada, 'Placa actualizada');
  } catch (err) {
    next(err);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const empresaId = req.esAdminGlobal ? null : req.empresaId;
    await placasService.eliminar(
      req.params.id,
      req.user.userId,
      empresaId
    );
    return success(res, null, 'Placa eliminada');
  } catch (err) {
    next(err);
  }
};