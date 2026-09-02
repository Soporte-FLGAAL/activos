const rolPermisosService = require('./rol_permisos.service');
const { success } = require('../../utils/response');
const { paginate } = require('../../utils/pagination');

exports.listarPermisosDeRol = async (req, res, next) => {
  try {
    const { rolId } = req.params;
    const resultado = await paginate(
      (f) => rolPermisosService.listarPermisosDeRol(rolId, f),
      () => rolPermisosService.contarPermisosDeRol(rolId),
      req.query,
      {}
    );
    return success(res, resultado, 'Permisos del rol');
  } catch (err) { next(err); }
};

exports.asignarPermiso = async (req, res, next) => {
  try {
    const { rolId, permisoId } = req.body;
    await rolPermisosService.asignarPermiso(rolId, permisoId);
    return success(res, null, 'Permiso asignado', 201);
  } catch (err) { next(err); }
};

exports.quitarPermiso = async (req, res, next) => {
  try {
    const { rolId, permisoId } = req.params;
    await rolPermisosService.quitarPermiso(rolId, permisoId);
    return success(res, null, 'Permiso quitado');
  } catch (err) { next(err); }
};