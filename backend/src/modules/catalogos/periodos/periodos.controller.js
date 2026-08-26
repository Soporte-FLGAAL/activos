const periodosService = require('./periodos.service');
const { success } = require('../../../utils/response');

exports.listar = async (req, res, next) => {
  try {
    const items = await periodosService.listar();
    return success(res, items, 'Periodos obtenidos');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const item = await periodosService.obtener(req.params.id);
    return success(res, item, 'Periodo encontrado');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nuevo = await periodosService.crear(req.body);
    return success(res, nuevo, 'Periodo creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await periodosService.actualizar(req.params.id, req.body);
    return success(res, actualizado, 'Periodo actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await periodosService.eliminar(req.params.id);
    return success(res, null, 'Periodo eliminado');
  } catch (err) { next(err); }
};