const estadoUnidadRepository = require('./estado_unidad.repository');
const { registrarMovimiento } = require('../../../utils/audit');

class EstadoUnidadService {
  async listar(filters) {
    return estadoUnidadRepository.findAll(filters);
  }

  async contar(filters) {
    return estadoUnidadRepository.count(filters);
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

  async crear(data, usuarioId) {
    const dbData = { EsU_estado: data.estado };
    const nuevo = await estadoUnidadRepository.create(dbData);
    await registrarMovimiento('Estado_Unidad', nuevo.EsU_Id, 'INSERT', dbData, usuarioId);
    return nuevo;
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);
    const dbData = {};
    if (data.estado !== undefined) dbData.EsU_estado = data.estado;
    const actualizado = await estadoUnidadRepository.update(id, dbData);
    await registrarMovimiento('Estado_Unidad', id, 'UPDATE', dbData, usuarioId);
    return actualizado;
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);
    const eliminado = await estadoUnidadRepository.delete(id);
    if (eliminado) {
      await registrarMovimiento('Estado_Unidad', id, 'DELETE', {}, usuarioId);
    }
    return eliminado;
  }
}

module.exports = new EstadoUnidadService();