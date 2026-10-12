const permisosRepository = require('./permisos.repository');
const { registrarMovimiento } = require('../../utils/audit');

class PermisosService {
  async listar(filters) {
    return permisosRepository.findAll(filters);
  }

  async contar(filters) {
    return permisosRepository.count(filters);
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

  async crear(data, usuarioId) {
    return withTransaction(async (connection) => {
      const nuevoId = await permisosRepository.create(
        { PerM_nombre: data.nombre },
        connection
      );
      await registrarMovimiento(
        'Permisos', nuevoId, 'INSERT', { nombre: data.nombre }, usuarioId, connection
      );
      return nuevoId;
    }).then((id) => this.obtener(id));
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);

    return withTransaction(async (connection) => {
      const ok = await permisosRepository.update(
        id,
        { PerM_nombre: data.nombre },
        connection
      );
      if (!ok) {
        const error = new Error('No se pudo actualizar el permiso');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento(
        'Permisos', id, 'UPDATE', { nombre: data.nombre }, usuarioId, connection
      );
      return true;
    }).then(() => this.obtener(id));
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);

    return withTransaction(async (connection) => {
      const ok = await permisosRepository.delete(id, connection);
      if (!ok) {
        const error = new Error('No se pudo eliminar el permiso');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Permisos', id, 'DELETE', {}, usuarioId, connection);
      return true;
    });
  }
}

module.exports = new PermisosService();