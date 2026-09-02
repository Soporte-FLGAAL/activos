const cotejosService = require('./cotejos.service');
const { success } = require('../../utils/response');
const { paginate } = require('../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    const filtros = {
          tarjetaId: req.query.tarjetaId || null,
        };
        const resultado = await paginate(
          (f) => cotejosService.listar(f),
          (f) => cotejosService.contar(f),
          req.query,
          filtros
        );
        return success(res, resultado, 'Cotejos obtenidos');
      } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const cotejo = await cotejosService.obtener(req.params.id);
    return success(res, cotejo, 'Cotejo encontrado');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const nuevo = await cotejosService.crear(req.body, req.user.userId);
    return success(res, nuevo, 'Cotejo creado', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const actualizado = await cotejosService.actualizar(req.params.id, req.body, req.user.userId);
    return success(res, actualizado, 'Cotejo actualizado');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await cotejosService.eliminar(req.params.id, req.user.userId);
    return success(res, null, 'Cotejo eliminado');
  } catch (err) { next(err); }
};