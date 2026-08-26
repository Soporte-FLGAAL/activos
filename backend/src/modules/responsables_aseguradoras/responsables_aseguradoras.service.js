const responsablesAseguradorasRepository = require('./responsables_aseguradoras.repository');

class ResponsablesAseguradorasService {
  async listar(aseguradoraId) {
    return responsablesAseguradorasRepository.findAll(aseguradoraId);
  }

  async obtener(id) {
    const responsable = await responsablesAseguradorasRepository.findById(id);
    if (!responsable) {
      const error = new Error('Responsable de aseguradora no encontrado');
      error.status = 404;
      throw error;
    }
    return responsable;
  }

  async crear(data) {
    const dbData = {
      RA_aseguradora: data.aseguradoraId,
      RA_responsable: data.responsable,
      RA_puesto_responsable: data.puestoResponsable || null,
      RA_telefono: data.telefono,
      RA_empresa_responsable: data.empresaResponsableId || null,
    };
    return responsablesAseguradorasRepository.create(dbData);
  }

  async actualizar(id, data) {
    await this.obtener(id);
    const map = {
      aseguradoraId: 'RA_aseguradora',
      responsable: 'RA_responsable',
      puestoResponsable: 'RA_puesto_responsable',
      telefono: 'RA_telefono',
      empresaResponsableId: 'RA_empresa_responsable',
    };
    const dbData = {};
    for (const key in data) {
      if (map[key]) dbData[map[key]] = data[key];
    }
    return responsablesAseguradorasRepository.update(id, dbData);
  }

  async eliminar(id) {
    await this.obtener(id);
    return responsablesAseguradorasRepository.delete(id);
  }
}

module.exports = new ResponsablesAseguradorasService();