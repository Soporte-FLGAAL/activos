const responsablesAseguradorasService = require('./responsables_aseguradoras.service');
const { success } = require('../../utils/response');

exports.listar = async (req, res, next) => {
  try {
    const { aseguradoraId } = req.query;
    const responsables = await responsablesAseguradorasService.listar(aseguradoraId);
    return success(res, responsables, 'Responsables obtenidos');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const responsable = await responsablesAseguradorasService.obtener(req.params.id);
    return success(res, responsable, 'Responsable encontrado');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nuevo = await responsablesAseguradorasService.crear(req.body);
    return success(res, nuevo, 'Responsable creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await responsablesAseguradorasService.actualizar(req.params.id, req.body);
    return success(res, actualizado, 'Responsable actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await responsablesAseguradorasService.eliminar(req.params.id);
    return success(res, null, 'Responsable eliminado');
  } catch (err) { next(err); }
};