const polizasRepository = require('./polizas.repository');

class PolizasService {
  async listar(filters) {
    return polizasRepository.findAll(filters);
  }

  async obtener(id) {
    const poliza = await polizasRepository.findById(id);
    if (!poliza) {
      const error = new Error('Póliza no encontrada');
      error.status = 404;
      throw error;
    }
    return poliza;
  }

  async crear(data) {
    const dbData = {
      Pol_poliza: data.poliza,
      Pol_aseguradora: data.aseguradoraId,
      Pol_unidad_id: data.unidadId,
      Pol_tipo_poliza: data.tipoPolizaId,
      Pol_fecha_inicio: data.fechaInicio,
      Pol_fecha_fin: data.fechaFin,
      Pol_costo: data.costo,
      Pol_url: data.url,
    };
    return polizasRepository.create(dbData);
  }

  async actualizar(id, data) {
    await this.obtener(id);
    const map = {
      poliza: 'Pol_poliza',
      aseguradoraId: 'Pol_aseguradora',
      unidadId: 'Pol_unidad_id',
      tipoPolizaId: 'Pol_tipo_poliza',
      fechaInicio: 'Pol_fecha_inicio',
      fechaFin: 'Pol_fecha_fin',
      costo: 'Pol_costo',
      url: 'Pol_url',
    };
    const dbData = {};
    for (const key in data) {
      if (map[key]) dbData[map[key]] = data[key];
    }
    return polizasRepository.update(id, dbData);
  }

  async actualizarUrl(id, url) {
    await this.obtener(id);
    return polizasRepository.updateUrl(id, url);
  }

  async eliminar(id) {
    await this.obtener(id);
    return polizasRepository.delete(id);
  }
}

module.exports = new PolizasService();