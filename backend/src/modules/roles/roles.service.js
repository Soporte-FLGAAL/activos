const rolesRepository = require('./roles.repository');

class RolesService {
  async listar() {
    return rolesRepository.findAll();
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

  async crear(data) {
    return rolesRepository.create({ Rol_nombre: data.nombre });
  }

  async actualizar(id, data) {
    await this.obtener(id);
    return rolesRepository.update(id, { Rol_nombre: data.nombre });
  }

  async eliminar(id) {
    await this.obtener(id);
    return rolesRepository.delete(id);
  }
}

module.exports = new RolesService();