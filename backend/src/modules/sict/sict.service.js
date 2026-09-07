const sictRepository = require('./sict.repository');
const { registrarMovimiento } = require('../../utils/audit');
const { existeRegistro } = require('../../utils/validators');

class SictService {
  async listar(filters) {
    return sictRepository.findAll(filters);
  }

  async contar(filters) {
    return sictRepository.count(filters);
  }

  async obtener(id) {
    const permiso = await sictRepository.findById(id);
    if (!permiso) {
      const error = new Error('Permiso SICT no encontrado');
      error.status = 404;
      throw error;
    }
    return permiso;
  }

  async crear(data, usuarioId) {
    if (!(await existeRegistro('Unidades', 'Uni_id', data.unidadId))) {
      const error = new Error('La unidad no existe');
      error.status = 422;
      throw error;
    }

    const dbData = {
      SICT_permiso: data.permiso,
      SICT_unidad_id: data.unidadId,
      SICT_fecha_obtencion: data.fechaObtencion,
      SICT_fecha_vencimiento: data.fechaVencimiento,
      SICT_url: data.url,
    };
    const nuevo = await sictRepository.create(dbData);
    await registrarMovimiento('SICT', nuevo.SICT_id, 'INSERT', dbData, usuarioId);
    return nuevo;
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);
    if (!(await existeRegistro('Unidades', 'Uni_id', data.unidadId))) {
      const error = new Error('La unidad no existe');
      error.status = 422;
      throw error;
    }

    const map = {
      permiso: 'SICT_permiso',
      unidadId: 'SICT_unidad_id',
      fechaObtencion: 'SICT_fecha_obtencion',
      fechaVencimiento: 'SICT_fecha_vencimiento',
      url: 'SICT_url',
    };
    const dbData = {};
    for (const key in data) {
      if (map[key]) dbData[map[key]] = data[key];
    }
    const actualizado = await sictRepository.update(id, dbData);
    await registrarMovimiento('SICT', id, 'UPDATE', dbData, usuarioId);
    return actualizado;
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);
    const eliminado = await sictRepository.delete(id);
    if (eliminado) {
      await registrarMovimiento('SICT', id, 'DELETE', {}, usuarioId);
    }
    return eliminado;
  }
}

module.exports = new SictService();