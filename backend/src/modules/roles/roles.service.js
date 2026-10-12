const rolesRepository = require('./roles.repository');
const { registrarMovimiento } = require('../../utils/audit');

class RolesService {
  async listar(filters) {
    return rolesRepository.findAll(filters);
  }

  async contar(filters) {
    return rolesRepository.count(filters);
  }

  async obtener(id) {
    const rol = await rolesRepository.findById(id);
    if (!rol) {
      const error = new Error('Rol no encontrado');
      error.status = 404;
      throw error;
    }
    return rol;
  }

  async crear(data, usuarioId, esAdminGlobal = false) {
    if (data.nombre === 'ADMIN_GLOBAL' && !esAdminGlobal) {
      const error = new Error('Solo un administrador global puede crear el rol ADMIN_GLOBAL');
      error.status = 403;
      throw error;
    }

    return withTransaction(async (connection) => {
      const nuevoId = await rolesRepository.create(
        { Rol_nombre: data.nombre },
        connection
      );
      await registrarMovimiento( 'Roles', nuevoId, 'INSERT', { nombre: data.nombre }, usuarioId, connection);
      return nuevoId;
    }).then((id) => this.obtener(id));
  }

  async actualizar(id, data, usuarioId, esAdminGlobal = false) {
    const rolActual = await this.obtener(id);
    const afectaAdminGlobal =
      rolActual.Rol_nombre === 'ADMIN_GLOBAL' || data.nombre === 'ADMIN_GLOBAL';
    if (afectaAdminGlobal && !esAdminGlobal) {
      const error = new Error('Solo un administrador global puede modificar el rol ADMIN_GLOBAL');
      error.status = 403;
      throw error;
    }

    return withTransaction(async (connection) => {
      const ok = await rolesRepository.update(id,{ Rol_nombre: data.nombre },connection);
      if (!ok) {
        const error = new Error('No se pudo actualizar el rol');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Roles',id,'UPDATE',{ nombreAnterior: rolActual.Rol_nombre, nombreNuevo: data.nombre },usuarioId,connection);
      return true;
    }).then(() => this.obtener(id));
  }

  async eliminar(id, usuarioId, esAdminGlobal = false) {
    const rol = await this.obtener(id);
    if (rol.Rol_nombre === 'ADMIN_GLOBAL' && !esAdminGlobal) {
      const error = new Error('Solo un administrador global puede eliminar el rol ADMIN_GLOBAL');
      error.status = 403;
      throw error;
    }

    return withTransaction(async (connection) => {
      const ok = await rolesRepository.delete(id, connection);
      if (!ok) {
        const error = new Error('No se pudo eliminar el rol');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Roles', id, 'DELETE', { nombre: rol.Rol_nombre }, usuarioId, connection);
      return true;
    });
  }
}

module.exports = new RolesService();