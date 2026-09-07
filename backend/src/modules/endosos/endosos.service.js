const endososRepository = require('./endosos.repository');
const { registrarMovimiento } = require('../../utils/audit');
const { existeRegistro } = require('../../utils/validators');

class EndososService {
  async listar(filters) {
    return endososRepository.findAll(filters);
  }

  async contar(filters) {
    return endososRepository.count(filters);
  }

  async obtener(id) {
    const endoso = await endososRepository.findById(id);
    if (!endoso) {
      const error = new Error('Endoso no encontrado');
      error.status = 404;
      throw error;
    }
    return endoso;
  }

  async crear(data, usuarioId) {
    if (!(await existeRegistro('Polizas', 'Pol_id', data.polizaId))) {
      const error = new Error('La póliza no existe');
      error.status = 422;
      throw error;
    }

    const dbData = {
      End_endoso: data.endoso,
      End_poliza: data.polizaId,
      End_url: data.url,
    };
    const nuevo = await endososRepository.create(dbData);
    await registrarMovimiento('Endoso', nuevo.End_id, 'INSERT', dbData, usuarioId);
    return nuevo;
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);
    if (!(await existeRegistro('Polizas', 'Pol_id', data.polizaId))) {
      const error = new Error('La póliza no existe');
      error.status = 422;
      throw error;
    }
    
    const map = {
      endoso: 'End_endoso',
      polizaId: 'End_poliza',
      url: 'End_url',
    };
    const dbData = {};
    for (const key in data) {
      if (map[key]) dbData[map[key]] = data[key];
    }
    const actualizado = await endososRepository.update(id, dbData);
    await registrarMovimiento('Endoso', id, 'UPDATE', dbData, usuarioId);
    return actualizado;
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);
    const eliminado = await endososRepository.delete(id);
    if (eliminado) {
      await registrarMovimiento('Endoso', id, 'DELETE', {}, usuarioId);
    }
    return eliminado;
  }
}

module.exports = new EndososService();