const tipoMovimientoPlacaRepository = require('./tipo_movimiento_placa.repository');

class TipoMovimientoPlacaService {
  async listar() {
    return tipoMovimientoPlacaRepository.findAll();
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

  async crear(data) {
    const dbData = { TpMP_nombre: data.nombre };
    return tipoMovimientoPlacaRepository.create(dbData);
  }

  async actualizar(id, data) {
    await this.obtener(id);
    const dbData = {};
    if (data.nombre !== undefined) dbData.TpMP_nombre = data.nombre;
    return tipoMovimientoPlacaRepository.update(id, dbData);
  }

  async eliminar(id) {
    await this.obtener(id);
    return tipoMovimientoPlacaRepository.delete(id);
  }
}

module.exports = new TipoMovimientoPlacaService();