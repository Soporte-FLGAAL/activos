const tarjetasService = require('./tarjetas.service');
const { success } = require('../../utils/response');
const { paginate } = require('../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    const filtros = {
      unidadId: req.query.unidadId || null,
      status: req.query.status || null,
      vencida: req.query.vencida || null,
    };
    const resultado = await paginate(
      (f) => tarjetasService.listar(f),
      (f) => tarjetasService.contar(f),
      req.query,
      filtros
    );
    return success(res, resultado, 'Tarjetas obtenidas');
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
    const nueva = await tarjetasService.crear(req.body, req.user.userId);
    return success(res, nueva, 'Tarjeta creada', 201);
  } catch (err) { next(err); }
};

exports.crearConCotejos = async (req, res, next) => {
  try {
    const { tarjeta, cotejos } = req.body;
    const tarjetaId = await tarjetasService.crearTarjetaConCotejos(tarjeta, cotejos, req.user.userId);
    return success(res, { id: tarjetaId }, 'Tarjeta y cotejos creados', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizada = await tarjetasService.actualizar(req.params.id, req.body, req.user.userId);
    return success(res, actualizada, 'Tarjeta actualizada');
  } catch (err) { next(err); }
};

exports.actualizarUrl = async (req, res, next) => {
  try {
    const actualizada = await tarjetasService.actualizarUrl(req.params.id, req.body.url, req.user.userId);
    return success(res, actualizada, 'URL actualizada');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await tarjetasService.eliminar(req.params.id, req.user.userId);
    return success(res, null, 'Tarjeta eliminada');
  } catch (err) { next(err); }
};