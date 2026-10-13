const periodosRepository = require('./periodos.repository');
const { registrarMovimiento } = require('../../../utils/audit');
const { withTransaction } = require('../../../utils/transaction');

class PeriodosService {
  async listar(filters) {
    return periodosRepository.findAll(filters);
  }

  async contar(filters) {
    return periodosRepository.count(filters);
  }

  async obtener(id) {
    const item = await periodosRepository.findById(id);
    if (!item) {
      const error = new Error('Periodo no encontrado');
      error.status = 404;
      throw error;
    }
    return item;
  }

  async crear(data, usuarioId) {
    const dbData = { Per_nombre: data.nombre };
    return withTransaction(async (connection) => {
      const nuevoId = await periodosRepository.create(dbData, connection);
      await registrarMovimiento('Periodos', nuevoId, 'INSERT', dbData, usuarioId, connection);
      return nuevoId;
    }).then((id) => this.obtener(id));
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);
    const dbData = {};
    if (data.nombre !== undefined) dbData.Per_nombre = data.nombre;
    if (Object.keys(dbData).length === 0) {
      const error = new Error('No hay campos para actualizar');
      error.status = 400;
      throw error;
    }

    return withTransaction(async (connection) => {
      const ok = await periodosRepository.update(id, dbData, connection);
      if (!ok) {
        const error = new Error('No se pudo actualizar');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Periodos', id, 'UPDATE', dbData, usuarioId, connection);
      return true;
    }).then(() => this.obtener(id));
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);
    return withTransaction(async (connection) => {
      const ok = await periodosRepository.delete(id, connection);
      if (!ok) {
        const error = new Error('No se pudo eliminar');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Periodos', id, 'DELETE', {}, usuarioId, connection);
      return true;
    });
  }
}

module.exports = new PeriodosService();