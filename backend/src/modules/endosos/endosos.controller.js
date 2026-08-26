const endososService = require('./endosos.service');
const { success } = require('../../utils/response');

exports.listar = async (req, res, next) => {
  try {
    const { polizaId } = req.query;
    const endosos = await endososService.listar(polizaId);
    return success(res, endosos, 'Endosos obtenidos');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const endoso = await endososService.obtener(req.params.id);
    return success(res, endoso, 'Endoso encontrado');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nuevo = await endososService.crear(req.body);
    return success(res, nuevo, 'Endoso creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await endososService.actualizar(req.params.id, req.body);
    return success(res, actualizado, 'Endoso actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await endososService.eliminar(req.params.id);
    return success(res, null, 'Endoso eliminado');
  } catch (err) { next(err); }
};