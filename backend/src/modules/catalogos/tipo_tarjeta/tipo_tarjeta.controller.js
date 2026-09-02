const tipoTarjetaService = require('./tipo_tarjeta.service');
const { success } = require('../../../utils/response');
const { paginate } = require('../../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    const resultado = await paginate(
      (f) => tipoTarjetaService.listar(f),
      (f) => tipoTarjetaService.contar(f),
      req.query,
      {}
    );
    return success(res, resultado, 'Tipos de tarjeta obtenidos');
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
    const nuevo = await tipoTarjetaService.crear(req.body, req.user.userId);
    return success(res, nuevo, 'Tipo de tarjeta creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await tipoTarjetaService.actualizar(req.params.id, req.body, req.user.userId);
    return success(res, actualizado, 'Tipo de tarjeta actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await tipoTarjetaService.eliminar(req.params.id, req.user.userId);
    return success(res, null, 'Tipo de tarjeta eliminado');
  } catch (err) { next(err); }
};