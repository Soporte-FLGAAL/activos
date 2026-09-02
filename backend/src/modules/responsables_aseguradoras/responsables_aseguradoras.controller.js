const responsablesAseguradorasService = require('./responsables_aseguradoras.service');
const { success } = require('../../utils/response');
const { paginate } = require('../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    const filtros = {
      aseguradoraId: req.query.aseguradoraId || null,
    };
    const resultado = await paginate(
      (f) => responsablesAseguradorasService.listar(f),
      (f) => responsablesAseguradorasService.contar(f),
      req.query,
      filtros
    );
    return success(res, resultado, 'Responsables obtenidos');
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
    const nuevo = await responsablesAseguradorasService.crear(req.body, req.user.userId);
    return success(res, nuevo, 'Responsable creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await responsablesAseguradorasService.actualizar(req.params.id, req.body, req.user.userId);
    return success(res, actualizado, 'Responsable actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await responsablesAseguradorasService.eliminar(req.params.id, req.user.userId);
    return success(res, null, 'Responsable eliminado');
  } catch (err) { next(err); }
};