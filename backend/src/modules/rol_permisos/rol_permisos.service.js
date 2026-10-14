const rolPermisosRepository = require('./rol_permisos.repository');
const { registrarMovimiento } = require('../../utils/audit');
const { withTransaction } = require('../../utils/transaction');

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

    return withTransaction(async (connection) => {
      await rolPermisosRepository.asignar(rolId, permisoId, connection);
      await registrarMovimiento('Rol_Permisos',`${rolId}-${permisoId}`,'INSERT',{ rolId, permisoId },usuarioId, connection);
      return true;
    });
  }

  async quitarPermiso(rolId, permisoId, usuarioId) {
    return withTransaction(async (connection) => {
      const ok = await rolPermisosRepository.quitar(rolId, permisoId, connection);
      if (!ok) {
        const error = new Error('El permiso no estaba asignado a este rol');
        error.status = 404;
        throw error;
      }
      await registrarMovimiento('Rol_Permisos',`${rolId}-${permisoId}`,'DELETE',{ rolId, permisoId },usuarioId,connection);
      return true;
    });
  }
}

module.exports = new RolPermisosService();