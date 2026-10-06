const cotejosRepository = require('./cotejos.repository');
const { withTransaction } = require('../../utils/transaction');
const { registrarMovimiento } = require('../../utils/audit');
const { existeRegistro } = require('../../utils/validators');

class CotejosService {
  async listar(filters) { return cotejosRepository.findAll(filters); }
  async contar(filters) { return cotejosRepository.count(filters); }

  async obtener(id, empresaId = null) {
    const cotejo = await cotejosRepository.findById(id, empresaId);
    if (!cotejo) {
      const error = new Error('Cotejo no encontrado');
      error.status = 404;
      throw error;
    }
    return cotejo;
  }

  async crear(data, usuarioId, empresaId = null) {
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

    return withTransaction(async (connection) => {
      if (empresaId) {
        const [row] = await connection.query(
          `SELECT u.Uni_empresa_actual
           FROM Tarjeta_circulacion tc
           JOIN Unidades u ON tc.TC_unidad_id = u.Uni_id
           WHERE tc.TC_id = ?`,
          [data.tarjetaId]
        );
        if (row.length === 0 || row[0].Uni_empresa_actual !== empresaId) {
          const error = new Error('La tarjeta no pertenece a la empresa');
          error.status = 403;
          throw error;
        }
      }
      const nuevoId = await cotejosRepository.create(dbData, connection);
      await registrarMovimiento('Cotejos', nuevoId, 'INSERT', dbData, usuarioId, connection);
      return nuevoId;
    }).then((id) => this.obtener(id, empresaId));
  }

  async actualizar(id, data, usuarioId, empresaId = null) {
    await this.obtener(id, empresaId);
    const map = { tarjetaId: 'Cot_tarjeta_id', tarjetaCotejo: 'Cot_tarjeta_cotejo', fecha: 'Cot_fecha' };
    const dbData = {};
    for (const key in data) if (map[key]) dbData[map[key]] = data[key];

    return withTransaction(async (connection) => {
      // Si se cambia la tarjeta, validar que pertenezca a la empresa
      if (data.tarjetaId && empresaId) {
        const [row] = await connection.query(
          `SELECT u.Uni_empresa_actual
          FROM Tarjeta_circulacion tc
          JOIN Unidades u ON tc.TC_unidad_id = u.Uni_id
          WHERE tc.TC_id = ?`,
          [data.tarjetaId]
        );
        if (row.length === 0 || row[0].Uni_empresa_actual !== empresaId) {
          const error = new Error('La nueva tarjeta no pertenece a la empresa');
          error.status = 403;
          throw error;
        }
      }

      const ok = await cotejosRepository.update(id, dbData, empresaId, connection);
      if (!ok) {
        const error = new Error('No se pudo actualizar el cotejo');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Cotejos', id, 'UPDATE', dbData, usuarioId, connection);
      return true;
    }).then(() => this.obtener(id, empresaId));
  }

  async eliminar(id, usuarioId, empresaId = null) {
    await this.obtener(id, empresaId);
    return withTransaction(async (connection) => {
      const ok = await cotejosRepository.delete(id, empresaId, connection);
      if (!ok) {
        const error = new Error('No se pudo eliminar el cotejo');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Cotejos', id, 'DELETE', {}, usuarioId, connection);
      return true;
    });
  }
}

module.exports = new CotejosService();