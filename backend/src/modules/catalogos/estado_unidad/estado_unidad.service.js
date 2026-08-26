const estadoUnidadRepository = require('./estado_unidad.repository');

class EstadoUnidadService {
  async listar() {
    return estadoUnidadRepository.findAll();
  }

  async obtener(id) {
    const item = await estadoUnidadRepository.findById(id);
    if (!item) {
      const error = new Error('Estado de unidad no encontrado');
      error.status = 404;
      throw error;
    }
    return item;
  }

  async crear(data) {
    const dbData = { EsU_estado: data.estado };
    return estadoUnidadRepository.create(dbData);
  }

  async actualizar(id, data) {
    await this.obtener(id);
    const dbData = {};
    if (data.estado !== undefined) dbData.EsU_estado = data.estado;
    return estadoUnidadRepository.update(id, dbData);
  }

  async eliminar(id) {
    await this.obtener(id);
    return estadoUnidadRepository.delete(id);
  }
}

module.exports = new EstadoUnidadService();