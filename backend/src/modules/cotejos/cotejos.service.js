const cotejosRepository = require('./cotejos.repository');

class CotejosService {
  async listar(tarjetaId) {
    return cotejosRepository.findAll(tarjetaId);
  }

  async obtener(id) {
    const cotejo = await cotejosRepository.findById(id);
    if (!cotejo) {
      const error = new Error('Cotejo no encontrado');
      error.status = 404;
      throw error;
    }
    return cotejo;
  }

  async crear(data) {
    const dbData = {
      Cot_tarjeta_id: data.tarjetaId,
      Cot_tarjeta_cotejo: data.tarjetaCotejo,
      Cot_fecha: data.fecha,
    };
    return cotejosRepository.create(dbData);
  }

  async actualizar(id, data) {
    await this.obtener(id);
    const map = {
      tarjetaId: 'Cot_tarjeta_id',
      tarjetaCotejo: 'Cot_tarjeta_cotejo',
      fecha: 'Cot_fecha',
    };
    const dbData = {};
    for (const key in data) {
      if (map[key]) dbData[map[key]] = data[key];
    }
    return cotejosRepository.update(id, dbData);
  }

  async eliminar(id) {
    await this.obtener(id);
    return cotejosRepository.delete(id);
  }
}

module.exports = new CotejosService();