const tipoPolizaRepository = require('./tipo_poliza.repository');
const { registrarMovimiento } = require('../../../utils/audit');

class TipoPolizaService {
  async listar(filters) {
    return tipoPolizaRepository.findAll(filters);
  }

  async contar(filters) {
    return tipoPolizaRepository.count(filters);
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

  async crear(data, usuarioId) {
    const dbData = { TpP_nombre: data.nombre };
    const nuevo = await tipoPolizaRepository.create(dbData);
    await registrarMovimiento('Tipo_poliza', nuevo.TpP_id, 'INSERT', dbData, usuarioId);
    return nuevo;
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);
    const dbData = {};
    if (data.nombre !== undefined) dbData.TpP_nombre = data.nombre;
    const actualizado = await tipoPolizaRepository.update(id, dbData);
    await registrarMovimiento('Tipo_poliza', id, 'UPDATE', dbData, usuarioId);
    return actualizado;
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);
    const eliminado = await tipoPolizaRepository.delete(id);
    if (eliminado) {
      await registrarMovimiento('Tipo_poliza', id, 'DELETE', {}, usuarioId);
    }
    return eliminado;
  }
}

module.exports = new TipoPolizaService();