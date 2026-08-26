const polizasService = require('./polizas.service');
const { success } = require('../../utils/response');

exports.listar = async (req, res, next) => {
  try {
    const polizas = await polizasService.listar(req.query);
    return success(res, polizas, 'Pólizas obtenidas');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const poliza = await polizasService.obtener(req.params.id);
    return success(res, poliza, 'Póliza encontrada');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nueva = await polizasService.crear(req.body);
    return success(res, nueva, 'Póliza creada', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizada = await polizasService.actualizar(req.params.id, req.body);
    return success(res, actualizada, 'Póliza actualizada');
  } catch (err) { next(err); }
};

exports.actualizarUrl = async (req, res, next) => {
  try {
    const actualizada = await polizasService.actualizarUrl(req.params.id, req.body.url);
    return success(res, actualizada, 'URL actualizada');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await polizasService.eliminar(req.params.id);
    return success(res, null, 'Póliza eliminada');
  } catch (err) { next(err); }
};