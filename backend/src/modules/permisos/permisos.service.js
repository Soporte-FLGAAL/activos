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
    const nuevo = await permisosRepository.create({ PerM_nombre: data.nombre });
    await registrarMovimiento('Permisos', nuevo.PerM_id, 'INSERT', { nombre: data.nombre }, usuarioId);
    return nuevo;
  }

  async actualizar(id, data, usuarioId) {
    const actualizado = await permisosRepository.update(id, { PerM_nombre: data.nombre });
    await registrarMovimiento('Permisos', id, 'UPDATE', { nombre: data.nombre }, usuarioId);
    return actualizado;
  }

  async eliminar(id, usuarioId) {
    const eliminado = await permisosRepository.delete(id);
    if (eliminado) {
      await registrarMovimiento('Permisos', id, 'DELETE', {}, usuarioId);
    }
    return eliminado;
  }
}

module.exports = new PermisosService();