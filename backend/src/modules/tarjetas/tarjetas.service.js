const tarjetasRepository = require('./tarjetas.repository');

class TarjetasService {
  async listar(filters) {
    return tarjetasRepository.findAll(filters);
  }

  async obtener(id) {
    const tarjeta = await tarjetasRepository.findById(id);
    if (!tarjeta) {
      const error = new Error('Tarjeta de circulación no encontrada');
      error.status = 404;
      throw error;
    }
    return tarjeta;
  }

  async crear(data) {
    const dbData = {
      TC_tarjeta: data.tarjeta,
      TC_unidad_id: data.unidadId,
      TC_costo: data.costo,
      TC_tipo: data.tipoId,
      TC_status: data.status,
      TC_no_original: data.noOriginal || null,
      TC_placas_id: data.placasId,
      TC_fecha_obtencion: data.fechaObtencion,
      TC_fecha_vencimiento: data.fechaVencimiento || null,
      TC_fecha_reposicion: data.fechaReposicion || null,
      TC_costo_reposicion: data.costoReposicion || null,
      TC_url: data.url,
      TC_url_reposicion: data.urlReposicion || null,
    };
    return tarjetasRepository.create(dbData);
  }

  async actualizar(id, data) {
    await this.obtener(id);
    const map = {
      tarjeta: 'TC_tarjeta',
      unidadId: 'TC_unidad_id',
      costo: 'TC_costo',
      tipoId: 'TC_tipo',
      status: 'TC_status',
      noOriginal: 'TC_no_original',
      placasId: 'TC_placas_id',
      fechaObtencion: 'TC_fecha_obtencion',
      fechaVencimiento: 'TC_fecha_vencimiento',
      fechaReposicion: 'TC_fecha_reposicion',
      costoReposicion: 'TC_costo_reposicion',
      url: 'TC_url',
      urlReposicion: 'TC_url_reposicion',
    };
    const dbData = {};
    for (const key in data) {
      if (map[key]) dbData[map[key]] = data[key];
    }
    return tarjetasRepository.update(id, dbData);
  }

  async actualizarUrl(id, url) {
    await this.obtener(id);
    return tarjetasRepository.updateUrl(id, url);
  }

  async eliminar(id) {
    await this.obtener(id);
    return tarjetasRepository.delete(id);
  }
}

module.exports = new TarjetasService();