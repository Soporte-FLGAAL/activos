const dobleArticuladoRepository = require('./doble_articulado.repository');
const { registrarMovimiento } = require('../../utils/audit');
const { existeRegistro } = require('../../utils/validators');

class DobleArticuladoService {
  async listar(filters) {
      return dobleArticuladoRepository.findAll(filters);
    }
  
  async contar(filters) {
    return dobleArticuladoRepository.count(filters);
  }

  async obtener(id) {
    const permiso = await dobleArticuladoRepository.findById(id);
    if (!permiso) {
      const error = new Error('Permiso especial no encontrado');
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
      PDA_permiso: data.permiso,
      PDA_unidad_id: data.unidadId,
      PDA_fecha_obtencion: data.fechaObtencion,
      PDA_fecha_vencimiento: data.fechaVencimiento,
      PDA_url: data.url,
    };
    const nuevo = await dobleArticuladoRepository.create(dbData);
    await registrarMovimiento('Doble_articulado', nuevo.PDA_id, 'INSERT', dbData, usuarioId);
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
      permiso: 'PDA_permiso',
      unidadId: 'PDA_unidad_id',
      fechaObtencion: 'PDA_fecha_obtencion',
      fechaVencimiento: 'PDA_fecha_vencimiento',
      url: 'PDA_url',
    };
    const dbData = {};
    for (const key in data) {
      if (map[key]) dbData[map[key]] = data[key];
    }
    const actualizado = await dobleArticuladoRepository.update(id, dbData);
    await registrarMovimiento('Doble_articulado', id, 'UPDATE', dbData, usuarioId);
    return actualizado;
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);
    const eliminado = await dobleArticuladoRepository.delete(id);
    if (eliminado) {
      await registrarMovimiento('Doble_articulado', id, 'DELETE', {}, usuarioId);
    }
    return eliminado;
  }
}

module.exports = new DobleArticuladoService();