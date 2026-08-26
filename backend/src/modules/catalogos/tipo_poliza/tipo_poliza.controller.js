const tipoPolizaService = require('./tipo_poliza.service');
const { success } = require('../../../utils/response');

exports.listar = async (req, res, next) => {
  try {
    const items = await tipoPolizaService.listar();
    return success(res, items, 'Tipos de póliza obtenidos');
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
    const nuevo = await tipoPolizaService.crear(req.body);
    return success(res, nuevo, 'Tipo de póliza creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await tipoPolizaService.actualizar(req.params.id, req.body);
    return success(res, actualizado, 'Tipo de póliza actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await tipoPolizaService.eliminar(req.params.id);
    return success(res, null, 'Tipo de póliza eliminado');
  } catch (err) { next(err); }
};