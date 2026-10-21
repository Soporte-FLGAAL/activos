const tarjetasService = require('./tarjetas.service');
const { success, error } = require('../../utils/response');
const { paginate } = require('../../utils/pagination');

exports.listar = async (req, res, next) => {
  try {
    const q = req.validatedQuery || {};
    // Admin global puede filtrar cualquier empresa; usuario normal queda atado a la suya
    const empresaFiltro = req.esAdminGlobal
      ? (q.empresaId || null)
      : req.empresaId;

    const filtros = {
      empresaId: empresaFiltro,
      unidadId: q.unidadId || null,
      status: q.status || null,
      vencida: q.vencida || null,
    };
    const resultado = await paginate(
      (f) => tarjetasService.listar(f),
      (f) => tarjetasService.contar(f),
      req.query,
      filtros
    );
    return success(res, resultado, 'Tarjetas obtenidas');
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const empresaId = req.esAdminGlobal ? null : req.empresaId;
    const tarjeta = await tarjetasService.obtener(req.params.id, empresaId);
    return success(res, tarjeta, 'Tarjeta encontrada');
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    if (!req.esAdminGlobal) {
      return error(res, 'Solo un administrador global puede crear tarjetas de circulación', 403);
    }
    const nueva = await tarjetasService.crear(req.body, req.user.userId, req.esAdminGlobal);
    return success(res, nueva, 'Tarjeta creada', 201);
  } catch (err) { next(err); }
};

exports.crearConCotejos = async (req, res, next) => {
  try {
    if (!req.esAdminGlobal) {
      return error(res, 'Solo un administrador global puede crear tarjetas de circulación', 403);
    }
    const { tarjeta, cotejos } = req.body;
    const tarjetaId = await tarjetasService.crearTarjetaConCotejos(
      tarjeta,
      cotejos,
      req.user.userId,
      req.esAdminGlobal
    );
    return success(res, { id: tarjetaId }, 'Tarjeta y cotejos creados', 201);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    if (!req.esAdminGlobal) {
      return error(res, 'Solo un administrador global puede modificar tarjetas de circulación', 403);
    }
    const actualizada = await tarjetasService.actualizar(
      req.params.id,
      req.body,
      req.user.userId,
      req.esAdminGlobal
    );
    return success(res, actualizada, 'Tarjeta actualizada');
  } catch (err) { next(err); }
};

exports.actualizarUrl = async (req, res, next) => {
  try {
    if (!req.esAdminGlobal) {
      return error(res, 'Solo un administrador global puede modificar tarjetas de circulación', 403);
    }
    const actualizada = await tarjetasService.actualizarUrl(
      req.params.id,
      req.body.url,
      req.user.userId,
      req.esAdminGlobal
    );
    return success(res, actualizada, 'URL actualizada');
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    if (!req.esAdminGlobal) {
      return error(res, 'Solo un administrador global puede eliminar tarjetas de circulación', 403);
    }
    await tarjetasService.eliminar(req.params.id, req.user.userId, req.esAdminGlobal);
    return success(res, null, 'Tarjeta eliminada');
  } catch (err) { next(err); }
};