const tipoUnidadRepository = require('./tipo_unidad.repository');
const { registrarMovimiento } = require('../../../utils/audit');

class TipoUnidadService {
  async listar(filters) {
    return tipoUnidadRepository.findAll(filters);
  }

  async contar(filters) {
    return tipoUnidadRepository.count(filters);
  }

  async obtener(id) {
    const item = await tipoUnidadRepository.findById(id);
    if (!item) {
      const error = new Error('Tipo de unidad no encontrado');
      error.status = 404;
      throw error;
    }
    return item;
  }

  async crear(data, usuarioId) {
    const dbData = {
      TpU_nombre: data.nombre,
      TpU_nombre_corto: data.nombreCorto || null,
    };
    const nuevo = await tipoUnidadRepository.create(dbData);
    await registrarMovimiento('Tipo_unidad', nuevo.CampoId, 'INSERT', dbData, usuarioId);
    return nuevo;
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);
    const map = {
      nombre: 'TpU_nombre',
      nombreCorto: 'TpU_nombre_corto',
    };
    const dbData = {};
    for (const key in data) {
      if (map[key]) dbData[map[key]] = data[key];
    }
    const actualizado = await tipoUnidadRepository.update(id, dbData);
    await registrarMovimiento('Tipo_unidad', id, 'UPDATE', dbData, usuarioId);
    return actualizado;
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);
    const eliminado = await tipoUnidadRepository.delete(id);
    if (eliminado) {
      await registrarMovimiento('Tipo_unidad', id, 'DELETE', {}, usuarioId);
    }
    return eliminado;
  }
}

module.exports = new TipoUnidadService();