const empresasService = require('./empresas.service');
const { success } = require('../../utils/response');
const { paginate } = require('../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    const resultado = await paginate(
      (f) => empresasService.listar(f),
      (f) => empresasService.contar(f),
      req.query,
      {}
    );
    return success(res, resultado, 'Empresas obtenidas');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const empresa = await empresasService.obtener(req.params.id);
    return success(res, empresa, 'Empresa encontrada');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nueva = await empresasService.crear(req.body, req.user.userId);
    return success(res, nueva, 'Empresa creada', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizada = await empresasService.actualizar(req.params.id, req.body, req.user.userId);
    return success(res, actualizada, 'Empresa actualizada');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await empresasService.eliminar(req.params.id, req.user.userId);
    return success(res, null, 'Empresa eliminada');
  } catch (err) { next(err); }
};