const incisosService = require('./incisos.service');
const { success } = require('../../utils/response');
const { paginate } = require('../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    const filtros = {
      endosoId: req.query.endosoId || null,
    };
    const resultado = await paginate(
      (f) => incisosService.listar(f),
      (f) => incisosService.contar(f),
      req.query,
      filtros
    );
    return success(res, resultado, 'Incisos obtenidos');
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
    const nuevo = await incisosService.crear(req.body, req.user.userId);
    return success(res, nuevo, 'Inciso creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await incisosService.actualizar(req.params.id, req.body, req.user.userId);
    return success(res, actualizado, 'Inciso actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await incisosService.eliminar(req.params.id, req.user.userId);
    return success(res, null, 'Inciso eliminado');
  } catch (err) { next(err); }
};