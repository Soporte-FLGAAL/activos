const tipoPolizaService = require('./tipo_poliza.service');
const { success } = require('../../../utils/response');
const { paginate } = require('../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    const resultado = await paginate(
      (f) => tipoPolizaService.listar(f),
      (f) => tipoPolizaService.contar(f),
      req.query,
      {}
    );
    return success(res, resultado, 'Tipos de poliza obtenidos');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const item = await tipoPolizaService.obtener(req.params.id);
    return success(res, item, 'Tipo de póliza encontrado');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nuevo = await tipoPolizaService.crear(req.body, req.user.userId);
    return success(res, nuevo, 'Tipo de póliza creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await tipoPolizaService.actualizar(req.params.id, req.body, req.user.userId);
    return success(res, actualizado, 'Tipo de póliza actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await tipoPolizaService.eliminar(req.params.id, req.user.userId);
    return success(res, null, 'Tipo de póliza eliminado');
  } catch (err) { next(err); }
};