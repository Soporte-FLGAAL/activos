const tipoTarjetaRepository = require('./tipo_tarjeta.repository');
const { registrarMovimiento } = require('../../../utils/audit');

class TipoTarjetaService {
  async listar(filters) {
    return tipoTarjetaRepository.findAll(filters);
  }

  async contar(filters) {
    return tipoTarjetaRepository.count(filters);
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

  async crear(data, usuarioId) {
    const dbData = { TpT_nombre: data.nombre };
    const nuevo = await tipoTarjetaRepository.create(dbData);
    await registrarMovimiento('Tipo_tarjeta', nuevo.CampoId, 'INSERT', dbData, usuarioId);
    return nuevo;
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);
    const dbData = {};
    if (data.nombre !== undefined) dbData.TpT_nombre = data.nombre;
    const actualizado = await tipoTarjetaRepository.update(id, dbData);
    await registrarMovimiento('Tipo_tarjeta', id, 'UPDATE', dbData, usuarioId);
    return actualizado;
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);
    const eliminado = await tipoTarjetaRepository.delete(id);
    if (eliminado) {
      await registrarMovimiento('Tipo_tarjeta', id, 'DELETE', {}, usuarioId);
    }
    return eliminado;
  }
}

module.exports = new TipoTarjetaService();