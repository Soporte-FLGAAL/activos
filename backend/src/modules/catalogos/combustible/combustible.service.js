const combustibleRepository = require('./combustible.repository');
const { registrarMovimiento } = require('../../../utils/audit');

class CombustibleService {
  async listar(filters) {
    return combustibleRepository.findAll(filters);
  }

  async contar(filters) {
    return combustibleRepository.count(filters);
  }

  async obtener(id) {
    const item = await combustibleRepository.findById(id);
    if (!item) {
      const error = new Error('Combustible no encontrado');
      error.status = 404;
      throw error;
    }
    return item;
  }

  async crear(data, usuarioId) {
    const dbData = { Com_nombre: data.nombre };
    const nuevo = await combustibleRepository.create(dbData);
    await registrarMovimiento('Combustible', nuevo.Com_id, 'INSERT', dbData, usuarioId);
    return nuevo;
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);
    const dbData = {};
    if (data.nombre !== undefined) dbData.Com_nombre = data.nombre;
    const actualizado = await combustibleRepository.update(id, dbData);
    await registrarMovimiento('Combustible', id, 'UPDATE', dbData, usuarioId);
    return actualizado;
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);
    const eliminado = await combustibleRepository.delete(id);
    if (eliminado) {
      await registrarMovimiento('Combustible', id, 'DELETE', {}, usuarioId);
    }
    return eliminado;
  }
}

module.exports = new CombustibleService();