const rolPermisosRepository = require('./rol_permisos.repository');

class RolPermisosService {
  async listarPermisosDeRol(rolId) {
    return rolPermisosRepository.findPermisosByRol(rolId);
  }

  async asignarPermiso(rolId, permisoId) {
    const yaExiste = await rolPermisosRepository.existe(rolId, permisoId);
    if (yaExiste) {
      const error = new Error('El permiso ya está asignado a este rol');
      error.status = 409;
      throw error;
    }
    await rolPermisosRepository.asignar(rolId, permisoId);
    return true;
  }

  async quitarPermiso(rolId, permisoId) {
    await rolPermisosRepository.quitar(rolId, permisoId);
    return true;
  }
}

module.exports = new RolPermisosService();