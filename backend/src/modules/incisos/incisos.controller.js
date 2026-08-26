const incisosService = require('./incisos.service');
const { success } = require('../../utils/response');

exports.listar = async (req, res, next) => {
  try {
    const { endosoId } = req.query;
    const incisos = await incisosService.listar(endosoId);
    return success(res, incisos, 'Incisos obtenidos');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const inciso = await incisosService.obtener(req.params.id);
    return success(res, inciso, 'Inciso encontrado');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nuevo = await incisosService.crear(req.body);
    return success(res, nuevo, 'Inciso creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await incisosService.actualizar(req.params.id, req.body);
    return success(res, actualizado, 'Inciso actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await incisosService.eliminar(req.params.id);
    return success(res, null, 'Inciso eliminado');
  } catch (err) { next(err); }
};