const combustibleRepository = require('./combustible.repository');
const { registrarMovimiento } = require('../../../utils/audit');
const { withTransaction } = require('../../../utils/transaction');

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
    return withTransaction(async (connection) => {
      const nuevoId = await combustibleRepository.create(dbData, connection);
      await registrarMovimiento('Combustible', nuevoId, 'INSERT', dbData, usuarioId, connection);
      return nuevoId;
    }).then((id) => this.obtener(id));
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);
    const dbData = {};
    if (data.nombre !== undefined) dbData.Com_nombre = data.nombre;
    if (Object.keys(dbData).length === 0) {
          const error = new Error('No hay campos para actualizar');
          error.status = 400;
          throw error;
        }
    
    return withTransaction(async (connection) => {
      const ok = await combustibleRepository.update(id, dbData, connection);
      if (!ok) {
        const error = new Error('No se pudo actualizar');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Combustible', id, 'UPDATE', dbData, usuarioId, connection);
      return true;
    }).then(() => this.obtener(id));
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);
    return withTransaction(async (connection) => {
      const ok = await combustibleRepository.delete(id, connection);
      if (!ok) {
        const error = new Error('No se pudo eliminar');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Combustible', id, 'DELETE', {}, usuarioId, connection);
      return true;
    });
  }
}

module.exports = new CombustibleService();