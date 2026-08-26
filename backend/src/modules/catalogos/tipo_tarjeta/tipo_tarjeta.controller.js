const tipoTarjetaService = require('./tipo_tarjeta.service');
const { success } = require('../../../utils/response');

exports.listar = async (req, res, next) => {
  try {
    const items = await tipoTarjetaService.listar();
    return success(res, items, 'Tipos de tarjeta obtenidos');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const item = await tipoTarjetaService.obtener(req.params.id);
    return success(res, item, 'Tipo de tarjeta encontrado');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nuevo = await tipoTarjetaService.crear(req.body);
    return success(res, nuevo, 'Tipo de tarjeta creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await tipoTarjetaService.actualizar(req.params.id, req.body);
    return success(res, actualizado, 'Tipo de tarjeta actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await tipoTarjetaService.eliminar(req.params.id);
    return success(res, null, 'Tipo de tarjeta eliminado');
  } catch (err) { next(err); }
};