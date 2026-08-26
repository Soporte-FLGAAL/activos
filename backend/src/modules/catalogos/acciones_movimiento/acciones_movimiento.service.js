const accionesMovimientoRepository = require('./acciones_movimiento.repository');

class AccionesMovimientoService {
  async listar() {
    return accionesMovimientoRepository.findAll();
  }

  async obtener(id) {
    const item = await accionesMovimientoRepository.findById(id);
    if (!item) {
      const error = new Error('Acción de movimiento no encontrada');
      error.status = 404;
      throw error;
    }
    return item;
  }

  async crear(data) {
    const dbData = { AcM_nombre: data.nombre };
    return accionesMovimientoRepository.create(dbData);
  }

  async actualizar(id, data) {
    await this.obtener(id);
    const dbData = {};
    if (data.nombre !== undefined) dbData.AcM_nombre = data.nombre;
    return accionesMovimientoRepository.update(id, dbData);
  }

  async eliminar(id) {
    await this.obtener(id);
    return accionesMovimientoRepository.delete(id);
  }
}

module.exports = new AccionesMovimientoService();