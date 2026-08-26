const detallePlacasRepository = require('./detalle_placas.repository');

class DetallePlacasService {
  async listar(placasId) {
    return detallePlacasRepository.findAll(placasId);
  }

  async obtener(id) {
    const detalle = await detallePlacasRepository.findById(id);
    if (!detalle) {
      const error = new Error('Detalle de placa no encontrado');
      error.status = 404;
      throw error;
    }
    return detalle;
  }

  async crear(data) {
    const dbData = {
      DP_placas_id: data.placasId,
      DP_tipo_movimiento: data.tipoMovimientoId,
      DP_costo: data.costo,
      DP_fecha: data.fecha,
      DP_url: data.url,
    };
    return detallePlacasRepository.create(dbData);
  }

  async actualizar(id, data) {
    await this.obtener(id);
    const map = {
      placasId: 'DP_placas_id',
      tipoMovimientoId: 'DP_tipo_movimiento',
      costo: 'DP_costo',
      fecha: 'DP_fecha',
      url: 'DP_url',
    };
    const dbData = {};
    for (const key in data) {
      if (map[key]) dbData[map[key]] = data[key];
    }
    return detallePlacasRepository.update(id, dbData);
  }

  async eliminar(id) {
    await this.obtener(id);
    return detallePlacasRepository.delete(id);
  }
}

module.exports = new DetallePlacasService();