const cotejosRepository = require('./cotejos.repository');
const { registrarMovimiento } = require('../../utils/audit');
const { existeRegistro } = require('../../utils/validators');

class CotejosService {
  async listar(filters) {
      return cotejosRepository.findAll(filters);
    }
  
  async contar(filters) {
    return cotejosRepository.count(filters);
  }

  async obtener(id) {
    const cotejo = await cotejosRepository.findById(id);
    if (!cotejo) {
      const error = new Error('Cotejo no encontrado');
      error.status = 404;
      throw error;
    }
    return cotejo;
  }

  async crear(data, usuarioId) {
    if (!(await existeRegistro('Tarjeta_circulacion', 'TC_id', data.tarjetaId))) {
      const error = new Error('La tarjeta de circulación no existe');
      error.status = 422;
      throw error;
    }

    const dbData = {
      Cot_tarjeta_id: data.tarjetaId,
      Cot_tarjeta_cotejo: data.tarjetaCotejo,
      Cot_fecha: data.fecha,
    };
    const nuevo = await cotejosRepository.create(dbData);
    await registrarMovimiento('Cotejos', nuevo.Cot_id, 'INSERT', dbData, usuarioId);
    return nuevo;
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);
    if (!(await existeRegistro('Tarjeta_circulacion', 'TC_id', data.tarjetaId))) {
      const error = new Error('La tarjeta de circulación no existe');
      error.status = 422;
      throw error;
    }

    const map = {
      tarjetaId: 'Cot_tarjeta_id',
      tarjetaCotejo: 'Cot_tarjeta_cotejo',
      fecha: 'Cot_fecha',
    };
    const dbData = {};
    for (const key in data) {
      if (map[key]) dbData[map[key]] = data[key];
    }
    const actualizado = await cotejosRepository.update(id, dbData);
    await registrarMovimiento('Cotejos', id, 'UPDATE', dbData, usuarioId);
    return actualizado;
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);
    const eliminado = await cotejosRepository.delete(id);
    if (eliminado) {
      await registrarMovimiento('Cotejos', id, 'DELETE', {}, usuarioId);
    }
    return eliminado;
  }
}

module.exports = new CotejosService();