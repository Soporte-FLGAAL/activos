const tipoMovimientoPlacaRepository = require('./tipo_movimiento_placa.repository');
const { registrarMovimiento } = require('../../../utils/audit');

class TipoMovimientoPlacaService {
  async listar(filters) {
    return tipoMovimientoPlacaRepository.findAll(filters);
  }

  async contar(filters) {
    return tipoMovimientoPlacaRepository.count(filters);
  }

  async obtener(id) {
    const item = await tipoMovimientoPlacaRepository.findById(id);
    if (!item) {
      const error = new Error('Tipo de movimiento de placa no encontrado');
      error.status = 404;
      throw error;
    }
    return item;
  }

  async crear(data, usuarioId) {
    const dbData = { TpMP_nombre: data.nombre };
    return withTransaction(async (connection) => {
      const nuevoId = await tipoMovimientoPlacaRepository.create(dbData, connection);
      await registrarMovimiento('Tipo_movimiento_placa', nuevoId, 'INSERT', dbData, usuarioId, connection);
      return nuevoId;
    }).then((id) => this.obtener(id));
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);
    const dbData = {};
    if (data.nombre !== undefined) dbData.TpMP_nombre = data.nombre;
    if (Object.keys(dbData).length === 0) {
      const error = new Error('No hay campos para actualizar');
      error.status = 400;
      throw error;
    }

    return withTransaction(async (connection) => {
      const ok = await tipoMovimientoPlacaRepository.update(id, dbData, connection);
      if (!ok) {
        const error = new Error('No se pudo actualizar');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Tipo_movimiento_placa', id, 'UPDATE', dbData, usuarioId, connection);
      return true;
    }).then(() => this.obtener(id));
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);
    return withTransaction(async (connection) => {
      const ok = await tipoMovimientoPlacaRepository.delete(id, connection);
      if (!ok) {
        const error = new Error('No se pudo eliminar');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Tipo_movimiento_placa', id, 'DELETE', {}, usuarioId, connection);
      return true;
    });
  }
}

module.exports = new TipoMovimientoPlacaService();