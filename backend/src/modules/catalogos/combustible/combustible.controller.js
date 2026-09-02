const combustibleService = require('./combustible.service');
const { success } = require('../../../utils/response');
const { paginate } = require('../../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    const resultado = await paginate(
      (f) => combustibleService.listar(f),
      (f) => combustibleService.contar(f),
      req.query,
      {}
    );
    return success(res, resultado, 'Combustibles obtenidos');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const item = await combustibleService.obtener(req.params.id);
    return success(res, item, 'Combustible encontrado');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nuevo = await combustibleService.crear(req.body, req.user.userId);
    return success(res, nuevo, 'Combustible creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await combustibleService.actualizar(req.params.id, req.body, req.user.userId);
    return success(res, actualizado, 'Combustible actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await combustibleService.eliminar(req.params.id, req.user.userId);
    return success(res, null, 'Combustible eliminado');
  } catch (err) { next(err); }
};