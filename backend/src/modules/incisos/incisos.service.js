const incisosRepository = require('./incisos.repository');

class IncisosService {
  async listar(endosoId) {
    return incisosRepository.findAll(endosoId);
  }

  async obtener(id) {
    const inciso = await incisosRepository.findById(id);
    if (!inciso) {
      const error = new Error('Inciso no encontrado');
      error.status = 404;
      throw error;
    }
    return inciso;
  }

  async crear(data) {
    const dbData = {
      Inc_inciso: data.inciso,
      Inc_endoso: data.endosoId,
      Inc_url: data.url,
    };
    return incisosRepository.create(dbData);
  }

  async actualizar(id, data) {
    await this.obtener(id);
    const map = {
      inciso: 'Inc_inciso',
      endosoId: 'Inc_endoso',
      url: 'Inc_url',
    };
    const dbData = {};
    for (const key in data) {
      if (map[key]) dbData[map[key]] = data[key];
    }
    return incisosRepository.update(id, dbData);
  }

  async eliminar(id) {
    await this.obtener(id);
    return incisosRepository.delete(id);
  }
}

module.exports = new IncisosService();