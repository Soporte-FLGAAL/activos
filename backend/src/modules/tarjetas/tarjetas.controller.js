const tarjetasService = require('./tarjetas.service');
const { success } = require('../../utils/response');

exports.listar = async (req, res, next) => {
  try {
    const tarjetas = await tarjetasService.listar(req.query);
    return success(res, tarjetas, 'Tarjetas obtenidas');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const tarjeta = await tarjetasService.obtener(req.params.id);
    return success(res, tarjeta, 'Tarjeta encontrada');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nueva = await tarjetasService.crear(req.body);
    return success(res, nueva, 'Tarjeta creada', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizada = await tarjetasService.actualizar(req.params.id, req.body);
    return success(res, actualizada, 'Tarjeta actualizada');
  } catch (err) { next(err); }
};

exports.actualizarUrl = async (req, res, next) => {
  try {
    const actualizada = await tarjetasService.actualizarUrl(req.params.id, req.body.url);
    return success(res, actualizada, 'URL actualizada');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await tarjetasService.eliminar(req.params.id);
    return success(res, null, 'Tarjeta eliminada');
  } catch (err) { next(err); }
};