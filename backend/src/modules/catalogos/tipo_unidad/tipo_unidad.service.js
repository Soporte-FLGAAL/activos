const tipoUnidadRepository = require('./tipo_unidad.repository');

class TipoUnidadService {
  async listar() {
    return tipoUnidadRepository.findAll();
  }

  async obtener(id) {
    const item = await tipoUnidadRepository.findById(id);
    if (!item) {
      const error = new Error('Tipo de unidad no encontrado');
      error.status = 404;
      throw error;
    }
    return item;
  }

  async crear(data) {
    const dbData = {
      TpU_nombre: data.nombre,
      TpU_nombre_corto: data.nombreCorto || null,
    };
    return tipoUnidadRepository.create(dbData);
  }

  async actualizar(id, data) {
    await this.obtener(id);
    const map = {
      nombre: 'TpU_nombre',
      nombreCorto: 'TpU_nombre_corto',
    };
    const dbData = {};
    for (const key in data) {
      if (map[key]) dbData[map[key]] = data[key];
    }
    return tipoUnidadRepository.update(id, dbData);
  }

  async eliminar(id) {
    await this.obtener(id);
    return tipoUnidadRepository.delete(id);
  }
}

module.exports = new TipoUnidadService();