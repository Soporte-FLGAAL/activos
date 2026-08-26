const tipoPolizaRepository = require('./tipo_poliza.repository');

class TipoPolizaService {
  async listar() {
    return tipoPolizaRepository.findAll();
  }

  async obtener(id) {
    const item = await tipoPolizaRepository.findById(id);
    if (!item) {
      const error = new Error('Tipo de póliza no encontrado');
      error.status = 404;
      throw error;
    }
    return item;
  }

  async crear(data) {
    const dbData = { TpP_nombre: data.nombre };
    return tipoPolizaRepository.create(dbData);
  }

  async actualizar(id, data) {
    await this.obtener(id);
    const dbData = {};
    if (data.nombre !== undefined) dbData.TpP_nombre = data.nombre;
    return tipoPolizaRepository.update(id, dbData);
  }

  async eliminar(id) {
    await this.obtener(id);
    return tipoPolizaRepository.delete(id);
  }
}

module.exports = new TipoPolizaService();