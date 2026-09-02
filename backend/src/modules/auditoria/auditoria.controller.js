const auditoriaService = require('./auditoria.service');
const { success } = require('../../utils/response');

exports.listar = async (req, res, next) => {
  try {
    const filtros = {
      tabla: req.query.tabla || null,
      accionId: req.query.accionId || null,
      usuarioId: req.query.usuarioId || null,
      fechaInicio: req.query.fechaInicio || null,
      fechaFin: req.query.fechaFin || null,
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