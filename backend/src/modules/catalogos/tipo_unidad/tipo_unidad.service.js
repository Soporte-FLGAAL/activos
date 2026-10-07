const tipoUnidadRepository = require('./tipo_unidad.repository');
const { withTransaction } = require('../../../utils/transaction');
const { registrarMovimiento } = require('../../../utils/audit');

class TipoUnidadService {
  async listar(filters) {
    return tipoUnidadRepository.findAll(filters);
  }

  async contar(filters) {
    return tipoUnidadRepository.count(filters);
  }

  async obtener(id) {
    const item = await tipoUnidadRepository.findById(id);
    if (!item) {
      const error = new Error('Tipo de unidad no encontrado');
      error.status = 404;
      throw error;
    }
    return item;
  }

  async crear(data, usuarioId) {
    const dbData = {
      TpU_nombre: data.nombre,
      TpU_nombre_corto: data.nombreCorto || null,
    };

    return withTransaction(async (connection) => {
      const nuevoId = await tipoUnidadRepository.create(dbData, connection);
      await registrarMovimiento('Tipo_unidad', nuevoId, 'INSERT', dbData, usuarioId, connection);
      return nuevoId;
    });
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);
    const dbData = {};
    if (data.nombre !== undefined) dbData.TpU_nombre = data.nombre;
    if (data.nombreCorto !== undefined) dbData.TpU_nombre_corto = data.nombreCorto;

    return withTransaction(async (connection) => {
      const ok = await tipoUnidadRepository.update(id, dbData, connection);
      if (!ok) {
        const error = new Error('No se pudo actualizar el tipo de unidad');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Tipo_unidad', id, 'UPDATE', dbData, usuarioId, connection);
      return true;
    });
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);
    return withTransaction(async (connection) => {
      const ok = await tipoUnidadRepository.delete(id, connection);
      if (!ok) {
        const error = new Error('No se pudo eliminar el tipo de unidad');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Tipo_unidad', id, 'DELETE', {}, usuarioId, connection);
      return true;
    });
  }
}

module.exports = new TipoUnidadService();