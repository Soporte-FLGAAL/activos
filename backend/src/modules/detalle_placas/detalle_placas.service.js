const detallePlacasRepository = require('./detalle_placas.repository');
const { registrarMovimiento } = require('../../utils/audit');
const { existeRegistro } = require('../../utils/validators');

class DetallePlacasService {
  async listar(filters) {
    return detallePlacasRepository.findAll(filters);
  }

  async contar(filters) {
    return detallePlacasRepository.count(filters);
  }

  async obtener(id) {
    const detalle = await detallePlacasRepository.findById(id);
    if (!detalle) {
      const error = new Error('Detalle de placa no encontrado');
      error.status = 404;
      throw error;
    }
    return detalle;
  }

  async crear(data, usuarioId) {
    if (!(await existeRegistro('Placas', 'Pla_id', data.placasId))) {
      const error = new Error('La placa no existe');
      error.status = 422;
      throw error;
    }
    if (!(await existeRegistro('Tipo_movimiento_placa', 'TpMP_id', data.tipoMovimientoId))) {
      const error = new Error('El tipo de movimiento no existe');
      error.status = 422;
      throw error;
    }

    const dbData = {
      DP_placas_id: data.placasId,
      DP_tipo_movimiento: data.tipoMovimientoId,
      DP_costo: data.costo,
      DP_fecha: data.fecha,
      DP_url: data.url,
    };

    const nuevo = await detallePlacasRepository.create(dbData);
    await registrarMovimiento('Detalle_placas', nuevo.DP_id, 'INSERT', dbData, usuarioId);
    return nuevo;
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);
    if (!(await existeRegistro('Placas', 'Pla_id', data.placasId))) {
      const error = new Error('La placa no existe');
      error.status = 422;
      throw error;
    }
    if (!(await existeRegistro('Tipo_movimiento_placa', 'TpMP_id', data.tipoMovimientoId))) {
      const error = new Error('El tipo de movimiento no existe');
      error.status = 422;
      throw error;
    }
    
    const map = {
      placasId: 'DP_placas_id',
      tipoMovimientoId: 'DP_tipo_movimiento',
      costo: 'DP_costo',
      fecha: 'DP_fecha',
      url: 'DP_url',
    };
    const dbData = {};
    for (const key in data) {
      if (map[key]) dbData[map[key]] = data[key];
    }
    
    return withTransaction(async (connection) => {
      // Si se cambia la placa, validar que pertenezca a la empresa
      if (data.placasId && empresaId) {
        const [row] = await connection.query(
          'SELECT Pla_empresa_actual FROM Placas WHERE Pla_id = ?',
          [data.placasId]
        );
        if (row.length === 0 || row[0].Pla_empresa_actual !== empresaId) {
          const error = new Error('La nueva placa no pertenece a la empresa');
          error.status = 403;
          throw error;
        }
      }

      const ok = await detallePlacasRepository.update(id, dbData, empresaId, connection);
      if (!ok) {
        const error = new Error('No se pudo actualizar el detalle de placa');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Detalle_placas', id, 'UPDATE', dbData, usuarioId, connection);
      return true;
    }).then(() => this.obtener(id, empresaId));
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);
    const eliminado = await detallePlacasRepository.delete(id);
    if (eliminado) {
      await registrarMovimiento('Detalle_placas', id, 'DELETE', {}, usuarioId);
    }
    return eliminado;
  }
}

module.exports = new DetallePlacasService();