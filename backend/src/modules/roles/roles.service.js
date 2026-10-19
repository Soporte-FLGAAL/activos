const rolesRepository = require('./roles.repository');
const { withTransaction } = require('../../utils/transaction');
const { registrarMovimiento } = require('../../utils/audit');

const ROL_ADMIN_GLOBAL = 'ADMIN_GLOBAL';
// Otros roles del sistema que conviene proteger también
const ROLES_SISTEMA = new Set([ROL_ADMIN_GLOBAL]);

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
    if (ROLES_SISTEMA.has(data.nombre) && !esAdminGlobal) {
      const error = new Error(`Solo un administrador global puede crear el rol ${data.nombre}`);
      error.status = 403;
      throw error;
    }

    return withTransaction(async (connection) => {
      const nuevoId = await rolesRepository.create({ Rol_nombre: data.nombre }, connection);
      await registrarMovimiento('Roles', nuevoId, 'INSERT', { nombre: data.nombre }, usuarioId, connection);
      return nuevoId;
    }).then((id) => this.obtener(id));
  }

  async actualizar(id, data, usuarioId, esAdminGlobal = false) {
    const rolActual = await this.obtener(id);

    // *** Regla clave: los roles de sistema son inmutables en nombre ***
    if (ROLES_SISTEMA.has(rolActual.Rol_nombre)) {
      const error = new Error(
        `El rol ${rolActual.Rol_nombre} es un rol del sistema y no puede renombrarse`
      );
      error.status = 403;
      throw error;
    }

    // Si se intenta crear un rol con nombre reservado, también se bloquea
    if (ROLES_SISTEMA.has(data.nombre)) {
      if (!esAdminGlobal) {
        const error = new Error(`Solo un administrador global puede usar el nombre ${data.nombre}`);
        error.status = 403;
        throw error;
      }
      const error = new Error(
        `El nombre ${data.nombre} está reservado para un rol del sistema`
      );
      error.status = 409;
      throw error;
    }

    return withTransaction(async (connection) => {
      const ok = await rolesRepository.update(id, { Rol_nombre: data.nombre }, connection);
      if (!ok) {
        const error = new Error('No se pudo actualizar el rol');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Roles', id, 'UPDATE', { nombreAnterior: rolActual.Rol_nombre, nombreNuevo: data.nombre }, usuarioId, connection);
      return true;
    }).then(() => this.obtener(id));
  }

  async eliminar(id, usuarioId, esAdminGlobal = false) {
    const rol = await this.obtener(id);

    // *** Los roles de sistema no pueden eliminarse ***
    if (ROLES_SISTEMA.has(rol.Rol_nombre)) {
      const error = new Error(
        `El rol ${rol.Rol_nombre} es un rol del sistema y no puede eliminarse`
      );
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