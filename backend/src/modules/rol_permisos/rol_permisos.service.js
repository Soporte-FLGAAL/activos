const rolPermisosRepository = require('./rol_permisos.repository');
const { registrarMovimiento } = require('../../utils/audit');

class RolPermisosService {
  async listarPermisosDeRol(rolId, filters) {
    return rolPermisosRepository.findPermisosByRol(rolId, filters);
  }

  async contarPermisosDeRol(rolId) {
    return rolPermisosRepository.countByRol(rolId);
  }

  async asignarPermiso(rolId, permisoId, usuarioId) {
    const yaExiste = await rolPermisosRepository.existe(rolId, permisoId);
    if (yaExiste) {
      const error = new Error('El permiso ya está asignado a este rol');
      error.status = 409;
      throw error;
    }
    await rolPermisosRepository.asignar(rolId, permisoId);
    await registrarMovimiento('Rol_Permisos', `${rolId}-${permisoId}`, 'INSERT', { rolId, permisoId }, usuarioId);
    return true;
  }

  async quitarPermiso(rolId, permisoId, usuarioId) {
    await rolPermisosRepository.quitar(rolId, permisoId);
    await registrarMovimiento('Rol_Permisos', `${rolId}-${permisoId}`, 'DELETE', { rolId, permisoId }, usuarioId);
    return true;
  }
}

module.exports = new RolPermisosService();