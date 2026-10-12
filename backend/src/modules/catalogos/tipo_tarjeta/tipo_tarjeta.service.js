const tipoTarjetaRepository = require('./tipo_tarjeta.repository');
const { registrarMovimiento } = require('../../../utils/audit');

class TipoTarjetaService {
  async listar(filters) {
    return tipoTarjetaRepository.findAll(filters);
  }

  async contar(filters) {
    return tipoTarjetaRepository.count(filters);
  }

  async obtener(id) {
    const item = await tipoTarjetaRepository.findById(id);
    if (!item) {
      const error = new Error('Tipo de tarjeta no encontrado');
      error.status = 404;
      throw error;
    }
    return item;
  }

  async crear(data, usuarioId) {
    const dbData = { TpT_nombre: data.nombre };
    return withTransaction(async (connection) => {
      const nuevoId = await tipoTarjetaRepository.create(dbData, connection);
      await registrarMovimiento('Tipo_tarjeta', nuevoId, 'INSERT', dbData, usuarioId, connection);
      return nuevoId;
    }).then((id) => this.obtener(id));
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);
    const dbData = {};
    if (data.nombre !== undefined) dbData.TpT_nombre = data.nombre;
    if (Object.keys(dbData).length === 0) {
      const error = new Error('No hay campos para actualizar');
      error.status = 400;
      throw error;
    }

    return withTransaction(async (connection) => {
      const ok = await tipoTarjetaRepository.update(id, dbData, connection);
      if (!ok) {
        const error = new Error('No se pudo actualizar');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Tipo_tarjeta', id, 'UPDATE', dbData, usuarioId, connection);
      return true;
    }).then(() => this.obtener(id));
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);
    return withTransaction(async (connection) => {
      const ok = await tipoTarjetaRepository.delete(id, connection);
      if (!ok) {
        const error = new Error('No se pudo eliminar');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Tipo_tarjeta', id, 'DELETE', {}, usuarioId, connection);
      return true;
    });
  }
}

module.exports = new TipoTarjetaService();