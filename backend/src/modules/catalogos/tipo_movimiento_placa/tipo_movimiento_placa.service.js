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
    const nuevo = await tipoMovimientoPlacaRepository.create(dbData);
    await registrarMovimiento('Tipo_movimiento_placa', nuevo.CampoId, 'INSERT', dbData, usuarioId);
    return nuevo;
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);
    const dbData = {};
    if (data.nombre !== undefined) dbData.TpMP_nombre = data.nombre;
    const actualizado = await tipoMovimientoPlacaRepository.update(id, dbData);
    await registrarMovimiento('Tipo_movimiento_placa', id, 'UPDATE', dbData, usuarioId);
    return actualizado;
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);
    const eliminado = await tipoMovimientoPlacaRepository.delete(id);
    if (eliminado) {
      await registrarMovimiento('Tipo_movimiento_placa', id, 'DELETE', {}, usuarioId);
    }
    return eliminado;
  }
}

module.exports = new TipoMovimientoPlacaService();