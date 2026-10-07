const detallePlacasRepository = require('./detalle_placas.repository');
const { withTransaction } = require('../../utils/transaction');
const { registrarMovimiento } = require('../../utils/audit');
const { existeRegistro } = require('../../utils/validators');

class DetallePlacasService {
  async listar(filters) {
    return detallePlacasRepository.findAll(filters);
  }

  async contar(filters) {
    return detallePlacasRepository.count(filters);
  }

  async obtener(id, empresaId = null) {
    const detalle = await detallePlacasRepository.findById(id, empresaId);
    if (!detalle) {
      const error = new Error('Detalle de placa no encontrado');
      error.status = 404;
      throw error;
    }
    return detalle;
  }

  async crear(data, usuarioId, empresaId = null) {
    // Validar existencia de FKs
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

    return withTransaction(async (connection) => {
      // Validar pertenencia de la placa a la empresa
      if (empresaId) {
        const [row] = await connection.query(
          'SELECT Pla_empresa_actual FROM Placas WHERE Pla_id = ?',
          [data.placasId]
        );
        if (row.length === 0 || row[0].Pla_empresa_actual !== empresaId) {
          const error = new Error('La placa no pertenece a la empresa');
          error.status = 403;
          throw error;
        }
      }

      const nuevoId = await detallePlacasRepository.create(dbData, connection);
      await registrarMovimiento('Detalle_placas',nuevoId,'INSERT',dbData,usuarioId,connection);
      return nuevoId;
    }).then((id) => this.obtener(id, empresaId));
  }

  async actualizar(id, data, usuarioId, empresaId = null) {
    // Verifica existencia + pertenencia
    await this.obtener(id, empresaId);

    const map = {
      placasId: 'DP_placas_id',
      tipoMovimientoId: 'DP_tipo_movimiento',
      costo: 'DP_costo',
      fecha: 'DP_fecha',
      url: 'DP_url',
    };
    const dbData = {};
    for (const key in data) if (map[key]) dbData[map[key]] = data[key];

    if (Object.keys(dbData).length === 0) {
      const error = new Error('No hay campos para actualizar');
      error.status = 400;
      throw error;
    }

    return withTransaction(async (connection) => {
      // Si cambia la placa, validar pertenencia
      if (data.placasId !== undefined && empresaId) {
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

      // Si cambia el tipo de movimiento, validar existencia
      if (data.tipoMovimientoId !== undefined) {
        const [row] = await connection.query(
          'SELECT 1 FROM Tipo_movimiento_placa WHERE TpMP_id = ?',
          [data.tipoMovimientoId]
        );
        if (row.length === 0) {
          const error = new Error('El tipo de movimiento no existe');
          error.status = 422;
          throw error;
        }
      }

      const ok = await detallePlacasRepository.update(id, dbData, empresaId, connection);
      if (!ok) {
        const error = new Error('No se pudo actualizar el detalle');
        error.status = 500;
        throw error;
      }

      await registrarMovimiento('Detalle_placas',id,'UPDATE',dbData,usuarioId,connection);
      return true;
    }).then(() => this.obtener(id, empresaId));
  }

  async eliminar(id, usuarioId, empresaId = null) {
    await this.obtener(id, empresaId);

    return withTransaction(async (connection) => {
      const ok = await detallePlacasRepository.delete(id, empresaId, connection);
      if (!ok) {
        const error = new Error('No se pudo eliminar el detalle');
        error.status = 500;
        throw error;
      }

      await registrarMovimiento('Detalle_placas', id, 'DELETE', {}, usuarioId, connection);
      return true;
    });
  }
}

module.exports = new DetallePlacasService();