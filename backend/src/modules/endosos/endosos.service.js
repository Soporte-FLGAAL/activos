const endososRepository = require('./endosos.repository');

class EndososService {
  async listar(polizaId) {
    return endososRepository.findAll(polizaId);
  }

  async obtener(id) {
    const endoso = await endososRepository.findById(id);
    if (!endoso) {
      const error = new Error('Endoso no encontrado');
      error.status = 404;
      throw error;
    }
    return endoso;
  }

  async crear(data) {
    const dbData = {
      End_endoso: data.endoso,
      End_poliza: data.polizaId,
      End_url: data.url,
    };
    return endososRepository.create(dbData);
  }

  async actualizar(id, data) {
    await this.obtener(id);
    const map = {
      endoso: 'End_endoso',
      polizaId: 'End_poliza',
      url: 'End_url',
    };
    const dbData = {};
    for (const key in data) {
      if (map[key]) dbData[map[key]] = data[key];
    }
    return endososRepository.update(id, dbData);
  }

  async eliminar(id) {
    await this.obtener(id);
    return endososRepository.delete(id);
  }
}

module.exports = new EndososService();