const auditoriaService = require('./auditoria.service');
const { success } = require('../../utils/response');
const { paginate } = require('../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    const q = req.validatedQuery || {};
    const filtros = {
      tabla: q.tabla || null,
      accionId: q.accionId || null,
      usuarioId: q.usuarioId || null,
      fechaInicio: q.fechaInicio || null,
      fechaFin: q.fechaFin || null,
    };
    const resultado = await paginate(
      (f) => auditoriaService.listar(f),
      (f) => auditoriaService.contar(f),
      req.query,
      filtros
    );
    return success(res, resultado, 'Movimientos obtenidos');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const movimiento = await auditoriaService.obtener(req.params.id);
    return success(res, movimiento, 'Movimiento encontrado');
  } catch (err) { next(err); }
};