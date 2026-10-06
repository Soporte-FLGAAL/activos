const aseguradorasService = require('./aseguradoras.service');
const { success } = require('../../utils/response');
const { paginate } = require('../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    const resultado = await paginate(
      (f) => aseguradorasService.listar(f),
      (f) => aseguradorasService.contar(f),
      req.query,
      {}
    );
    return success(res, resultado, 'Aseguradoras obtenidas');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const aseguradora = await aseguradorasService.obtener(req.params.id);
    return success(res, aseguradora, 'Aseguradora encontrada');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nueva = await aseguradorasService.crear(req.body, req.user.userId);
    return success(res, nueva, 'Aseguradora creada', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizada = await aseguradorasService.actualizar(req.params.id, req.body, req.user.userId);
    return success(res, actualizada, 'Aseguradora actualizada');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await aseguradorasService.eliminar(req.params.id, req.user.userId);
    return success(res, null, 'Aseguradora eliminada');
  } catch (err) { next(err); }
};