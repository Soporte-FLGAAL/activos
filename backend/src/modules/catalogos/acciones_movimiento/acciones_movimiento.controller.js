const accionesMovimientoService = require('./acciones_movimiento.service');
const { success } = require('../../../utils/response');

exports.listar = async (req, res, next) => {
  try {
    const items = await accionesMovimientoService.listar();
    return success(res, items, 'Acciones de movimiento obtenidas');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const item = await accionesMovimientoService.obtener(req.params.id);
    return success(res, item, 'Acción de movimiento encontrada');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nuevo = await accionesMovimientoService.crear(req.body);
    return success(res, nuevo, 'Acción de movimiento creada', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await accionesMovimientoService.actualizar(req.params.id, req.body);
    return success(res, actualizado, 'Acción de movimiento actualizada');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await accionesMovimientoService.eliminar(req.params.id);
    return success(res, null, 'Acción de movimiento eliminada');
  } catch (err) { next(err); }
};