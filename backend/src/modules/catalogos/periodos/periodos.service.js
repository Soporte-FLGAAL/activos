const periodosRepository = require('./periodos.repository');

class PeriodosService {
  async listar() {
    return periodosRepository.findAll();
  }

  async obtener(id) {
    const item = await periodosRepository.findById(id);
    if (!item) {
      const error = new Error('Periodo no encontrado');
      error.status = 404;
      throw error;
    }
    return item;
  }

  async crear(data) {
    const dbData = { Per_nombre: data.nombre };
    return periodosRepository.create(dbData);
  }

  async actualizar(id, data) {
    await this.obtener(id);
    const dbData = {};
    if (data.nombre !== undefined) dbData.Per_nombre = data.nombre;
    return periodosRepository.update(id, dbData);
  }

  async eliminar(id) {
    await this.obtener(id);
    return periodosRepository.delete(id);
  }
}

module.exports = new PeriodosService();