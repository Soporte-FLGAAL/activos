const sictRepository = require('./sict.repository');

class SictService {
  async listar(unidadId) {
    return sictRepository.findAll(unidadId);
  }

  async obtener(id) {
    const permiso = await sictRepository.findById(id);
    if (!permiso) {
      const error = new Error('Permiso SICT no encontrado');
      error.status = 404;
      throw error;
    }
    return permiso;
  }

  async crear(data) {
    const dbData = {
      SICT_permiso: data.permiso,
      SICT_unidad_id: data.unidadId,
      SICT_fecha_obtencion: data.fechaObtencion,
      SICT_fecha_vencimiento: data.fechaVencimiento,
      SICT_url: data.url,
    };
    return sictRepository.create(dbData);
  }

  async actualizar(id, data) {
    await this.obtener(id);
    const map = {
      permiso: 'SICT_permiso',
      unidadId: 'SICT_unidad_id',
      fechaObtencion: 'SICT_fecha_obtencion',
      fechaVencimiento: 'SICT_fecha_vencimiento',
      url: 'SICT_url',
    };
    const dbData = {};
    for (const key in data) {
      if (map[key]) dbData[map[key]] = data[key];
    }
    return sictRepository.update(id, dbData);
  }

  async eliminar(id) {
    await this.obtener(id);
    return sictRepository.delete(id);
  }
}

module.exports = new SictService();