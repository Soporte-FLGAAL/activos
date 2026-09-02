const placasService = require('./placas.service');
const { success } = require('../../utils/response');
const { paginate } = require('../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    const filtros = {
      empresaId: req.query.empresaId || null,
    };
    const resultado = await paginate(
      (f) => placasService.listar(f),
      (f) => placasService.contar(f),
      req.query,
      filtros
    );
    return success(res, resultado, 'Placas obtenidas');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const placa = await placasService.obtener(req.params.id);
    return success(res, placa, 'Placa encontrada');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nueva = await placasService.crear(req.body, req.user.userId);
    return success(res, nueva, 'Placa creada', 201);
  } catch (err) { next(err); }
};

exports.actualizarConMovimiento = async (req, res, next) => {
  try {
    const { placa, movimiento } = req.body;
    await placasService.actualizarPlacaConMovimiento(req.params.id, placa, movimiento, req.user.userId);
    return success(res, null, 'Placa y movimiento actualizados');
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizada = await placasService.actualizar(req.params.id, req.body, req.user.userId);
    return success(res, actualizada, 'Placa actualizada');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await placasService.eliminar(req.params.id, req.user.userId);
    return success(res, null, 'Placa eliminada');
  } catch (err) { next(err); }
};