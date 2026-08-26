const placasService = require('./placas.service');
const { success } = require('../../utils/response');

exports.listar = async (req, res, next) => {
  try {
    const { empresaId } = req.query;
    const placas = await placasService.listar(empresaId);
    return success(res, placas, 'Placas obtenidas');
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
    const nueva = await placasService.crear(req.body);
    return success(res, nueva, 'Placa creada', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizada = await placasService.actualizar(req.params.id, req.body);
    return success(res, actualizada, 'Placa actualizada');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await placasService.eliminar(req.params.id);
    return success(res, null, 'Placa eliminada');
  } catch (err) { next(err); }
};