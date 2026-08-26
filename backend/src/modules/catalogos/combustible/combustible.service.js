const combustibleRepository = require('./combustible.repository');

class CombustibleService {
  async listar() {
    return combustibleRepository.findAll();
  }

  async obtener(id) {
    const item = await combustibleRepository.findById(id);
    if (!item) {
      const error = new Error('Combustible no encontrado');
      error.status = 404;
      throw error;
    }
    return item;
  }

  async crear(data) {
    const dbData = { Com_nombre: data.nombre };
    return combustibleRepository.create(dbData);
  }

  async actualizar(id, data) {
    await this.obtener(id);
    const dbData = {};
    if (data.nombre !== undefined) dbData.Com_nombre = data.nombre;
    return combustibleRepository.update(id, dbData);
  }

  async eliminar(id) {
    await this.obtener(id);
    return combustibleRepository.delete(id);
  }
}

module.exports = new CombustibleService();