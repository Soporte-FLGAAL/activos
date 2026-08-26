const permisosRepository = require('./permisos.repository');

class PermisosService {
  async listar() {
    return permisosRepository.findAll();
  }

  async obtener(id) {
    const permiso = await permisosRepository.findById(id);
    if (!permiso) {
      const error = new Error('Permiso no encontrado');
      error.status = 404;
      throw error;
    }
    return permiso;
  }

  async crear(data) {
    return permisosRepository.create({ PerM_nombre: data.nombre });
  }

  async actualizar(id, data) {
    await this.obtener(id);
    return permisosRepository.update(id, { PerM_nombre: data.nombre });
  }

  async eliminar(id) {
    await this.obtener(id);
    return permisosRepository.delete(id);
  }
}

module.exports = new PermisosService();