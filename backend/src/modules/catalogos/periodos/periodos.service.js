const periodosRepository = require('./periodos.repository');
const { registrarMovimiento } = require('../../../utils/audit');

class PeriodosService {
  async listar(filters) {
    return periodosRepository.findAll(filters);
  }

  async contar(filters) {
    return periodosRepository.count(filters);
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

  async crear(data, usuarioId) {
    const dbData = { Per_nombre: data.nombre };
    const nuevo = await periodosRepository.create(dbData);
    await registrarMovimiento('Periodos', nuevo.CampoId, 'INSERT', dbData, usuarioId);
    return nuevo;
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);
    const dbData = {};
    if (data.nombre !== undefined) dbData.Per_nombre = data.nombre;
    const actualizado = await periodosRepository.update(id, dbData);
    await registrarMovimiento('Periodos', id, 'UPDATE', dbData, usuarioId);
    return actualizado;
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);
    const eliminado = await periodosRepository.delete(id);
    if (eliminado) {
      await registrarMovimiento('Periodos', id, 'DELETE', {}, usuarioId);
    }
    return eliminado;
  }
}

module.exports = new PeriodosService();