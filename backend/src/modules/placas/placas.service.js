const placasRepository = require('./placas.repository');

class PlacasService {
  async listar(empresaId) {
    return placasRepository.findAll(empresaId);
  }

  async obtener(id) {
    const placa = await placasRepository.findById(id);
    if (!placa) {
      const error = new Error('Placa no encontrada');
      error.status = 404;
      throw error;
    }
    return placa;
  }

  async crear(data) {
    const dbData = {
      Pla_placas: data.placas,
      Pla_status: data.status,
      Pla_propietario: data.propietarioId || null,
      Pla_empresa_actual: data.empresaActualId,
    };
    return placasRepository.create(dbData);
  }

  async actualizar(id, data) {
    await this.obtener(id);
    const map = {
      placas: 'Pla_placas',
      status: 'Pla_status',
      propietarioId: 'Pla_propietario',
      empresaActualId: 'Pla_empresa_actual',
    };
    const dbData = {};
    for (const key in data) {
      if (map[key]) dbData[map[key]] = data[key];
    }
    return placasRepository.update(id, dbData);
  }

  async eliminar(id) {
    await this.obtener(id);
    return placasRepository.delete(id);
  }
}

module.exports = new PlacasService();