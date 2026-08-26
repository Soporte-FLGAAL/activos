const tipoTarjetaRepository = require('./tipo_tarjeta.repository');

class TipoTarjetaService {
  async listar() {
    return tipoTarjetaRepository.findAll();
  }

  async obtener(id) {
    const item = await tipoTarjetaRepository.findById(id);
    if (!item) {
      const error = new Error('Tipo de tarjeta no encontrado');
      error.status = 404;
      throw error;
    }
    return item;
  }

  async crear(data) {
    const dbData = { TpT_nombre: data.nombre };
    return tipoTarjetaRepository.create(dbData);
  }

  async actualizar(id, data) {
    await this.obtener(id);
    const dbData = {};
    if (data.nombre !== undefined) dbData.TpT_nombre = data.nombre;
    return tipoTarjetaRepository.update(id, dbData);
  }

  async eliminar(id) {
    await this.obtener(id);
    return tipoTarjetaRepository.delete(id);
  }
}

module.exports = new TipoTarjetaService();