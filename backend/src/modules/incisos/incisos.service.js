const incisosRepository = require('./incisos.repository');
const { registrarMovimiento } = require('../../utils/audit');
const { existeRegistro } = require('../../utils/validators');

class IncisosService {
  async listar(filters) {
    return incisosRepository.findAll(filters);
  }

  async contar(filters) {
    return incisosRepository.count(filters);
  }

  async obtener(id) {
    const inciso = await incisosRepository.findById(id);
    if (!inciso) {
      const error = new Error('Inciso no encontrado');
      error.status = 404;
      throw error;
    }
    return inciso;
  }

  async crear(data, usuarioId) {
    if (!(await existeRegistro('Endoso', 'End_id', data.endosoId))) {
      const error = new Error('El endoso no existe');
      error.status = 422;
      throw error;
    }

    const dbData = {
      Inc_inciso: data.inciso,
      Inc_endoso: data.endosoId,
      Inc_url: data.url,
    };
    const nuevo = await incisosRepository.create(dbData);
    await registrarMovimiento('Inciso', nuevo.Inc_id, 'INSERT', dbData, usuarioId);
    return nuevo;
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);

    if (!(await existeRegistro('Endoso', 'End_id', data.endosoId))) {
      const error = new Error('El endoso no existe');
      error.status = 422;
      throw error;
    }

    const map = {
      inciso: 'Inc_inciso',
      endosoId: 'Inc_endoso',
      url: 'Inc_url',
    };
    const dbData = {};
    for (const key in data) {
      if (map[key]) dbData[map[key]] = data[key];
    }
    const actualizado = await incisosRepository.update(id, dbData);
    await registrarMovimiento('Inciso', id, 'UPDATE', dbData, usuarioId);
    return actualizado;
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);
    const eliminado = await incisosRepository.delete(id);
    if (eliminado) {
      await registrarMovimiento('Inciso', id, 'DELETE', {}, usuarioId);
    }
    return eliminado;
  }
}

module.exports = new IncisosService();