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

  async crear(data, usuarioId) {
    const nuevo = await rolesRepository.create({ Rol_nombre: data.nombre });
    await registrarMovimiento('Roles', nuevo.Rol_id, 'INSERT', { nombre: data.nombre }, usuarioId);
    return nuevo;
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);
    const actualizado = await rolesRepository.update(id, { Rol_nombre: data.nombre });
    await registrarMovimiento('Roles', id, 'UPDATE', { nombre: data.nombre }, usuarioId);
    return actualizado;
  }

  async eliminar(id, usuarioId) {
    const eliminado = await rolesRepository.delete(id);
    if (eliminado) {
      await registrarMovimiento('Roles', id, 'DELETE', {}, usuarioId);
    }
    return eliminado;
  }
}

module.exports = new RolesService();