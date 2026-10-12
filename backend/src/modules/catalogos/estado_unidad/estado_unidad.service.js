const estadoUnidadRepository = require('./estado_unidad.repository');
const { registrarMovimiento } = require('../../../utils/audit');

class EstadoUnidadService {
  async listar(filters) {
    return estadoUnidadRepository.findAll(filters);
  }

  async contar(filters) {
    return estadoUnidadRepository.count(filters);
  }

  async obtener(id) {
    const item = await estadoUnidadRepository.findById(id);
    if (!item) {
      const error = new Error('Estado de unidad no encontrado');
      error.status = 404;
      throw error;
    }
    return item;
  }

  async crear(data, usuarioId) {
    const dbData = { EsU_estado: data.estado };
    return withTransaction(async (connection) => {
      const nuevoId = await estadoUnidadRepository.create(dbData, connection);
      await registrarMovimiento('Estado_unidad', nuevoId, 'INSERT', dbData, usuarioId, connection);
      return nuevoId;
    }).then((id) => this.obtener(id));
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);
    const dbData = {};
    if (data.estado !== undefined) dbData.EsU_estado = data.estado;
    if (Object.keys(dbData).length === 0) {
      const error = new Error('No hay campos para actualizar');
      error.status = 400;
      throw error;
    }

    return withTransaction(async (connection) => {
      const ok = await estadoUnidadRepository.update(id, dbData, connection);
      if (!ok) {
        const error = new Error('No se pudo actualizar');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Estado_unidad', id, 'UPDATE', dbData, usuarioId, connection);
      return true;
    }).then(() => this.obtener(id));
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);
    return withTransaction(async (connection) => {
      const ok = await estadoUnidadRepository.delete(id, connection);
      if (!ok) {
        const error = new Error('No se pudo eliminar');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Estado_unidad', id, 'DELETE', {}, usuarioId, connection);
      return true;
    });
  }
}

module.exports = new EstadoUnidadService();