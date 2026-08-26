const dobleArticuladoRepository = require('./doble_articulado.repository');

class DobleArticuladoService {
  async listar(unidadId) {
    return dobleArticuladoRepository.findAll(unidadId);
  }

  async obtener(id) {
    const permiso = await dobleArticuladoRepository.findById(id);
    if (!permiso) {
      const error = new Error('Permiso especial no encontrado');
      error.status = 404;
      throw error;
    }
    return permiso;
  }

  async crear(data) {
    const dbData = {
      PDA_permiso: data.permiso,
      PDA_unidad_id: data.unidadId,
      PDA_fecha_obtencion: data.fechaObtencion,
      PDA_fecha_vencimiento: data.fechaVencimiento,
      PDA_url: data.url,
    };
    return dobleArticuladoRepository.create(dbData);
  }

  async actualizar(id, data) {
    await this.obtener(id);
    const map = {
      permiso: 'PDA_permiso',
      unidadId: 'PDA_unidad_id',
      fechaObtencion: 'PDA_fecha_obtencion',
      fechaVencimiento: 'PDA_fecha_vencimiento',
      url: 'PDA_url',
    };
    const dbData = {};
    for (const key in data) {
      if (map[key]) dbData[map[key]] = data[key];
    }
    return dobleArticuladoRepository.update(id, dbData);
  }

  async eliminar(id) {
    await this.obtener(id);
    return dobleArticuladoRepository.delete(id);
  }
}

module.exports = new DobleArticuladoService();