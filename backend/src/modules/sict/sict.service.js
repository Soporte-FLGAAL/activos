const sictRepository = require('./sict.repository');
const { withTransaction } = require('../../utils/transaction');
const { registrarMovimiento } = require('../../utils/audit');
const { existeRegistro } = require('../../utils/validators');

class SictService {
  async listar(filters) { return sictRepository.findAll(filters); }
  async contar(filters) { return sictRepository.count(filters); }

  async obtener(id, empresaId = null) {
    const permiso = await sictRepository.findById(id, empresaId);
    if (!permiso) {
      const error = new Error('Permiso SICT no encontrado');
      error.status = 404;
      throw error;
    }
    return permiso;
  }

  async crear(data, usuarioId, empresaId = null) {
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

    return withTransaction(async (connection) => {
      if (empresaId) {
        const [row] = await connection.query(
          'SELECT Uni_empresa_actual FROM Unidades WHERE Uni_id = ?',
          [data.unidadId]
        );
        if (row.length === 0 || row[0].Uni_empresa_actual !== empresaId) {
          const error = new Error('La unidad no pertenece a la empresa');
          error.status = 403;
          throw error;
        }
      }
      const nuevoId = await sictRepository.create(dbData, connection);
      await registrarMovimiento('SICT', nuevoId, 'INSERT', dbData, usuarioId, connection);
      return nuevoId;
    }).then((id) => this.obtener(id, empresaId));
  }

  async actualizar(id, data, usuarioId, empresaId = null) {
    await this.obtener(id, empresaId);
    const map = {
      permiso: 'SICT_permiso',
      unidadId: 'SICT_unidad_id',
      fechaObtencion: 'SICT_fecha_obtencion',
      fechaVencimiento: 'SICT_fecha_vencimiento',
      url: 'SICT_url',
    };
    const dbData = {};
    for (const key in data) if (map[key]) dbData[map[key]] = data[key];

    return withTransaction(async (connection) => {
      if (data.unidadId && empresaId) {
        const [row] = await connection.query(
          'SELECT Uni_empresa_actual FROM Unidades WHERE Uni_id = ?',
          [data.unidadId]
        );
        if (row.length === 0 || row[0].Uni_empresa_actual !== empresaId) {
          const error = new Error('La nueva unidad no pertenece a la empresa');
          error.status = 403;
          throw error;
        }
      }

      const ok = await sictRepository.update(id, dbData, empresaId, connection);
      if (!ok) {
        const error = new Error('No se pudo actualizar el permiso SICT');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('SICT', id, 'UPDATE', dbData, usuarioId, connection);
      return true;
    }).then(() => this.obtener(id, empresaId));
  }

  async eliminar(id, usuarioId, empresaId = null) {
    await this.obtener(id, empresaId);
    return withTransaction(async (connection) => {
      const ok = await sictRepository.delete(id, empresaId, connection);
      if (!ok) {
        const error = new Error('No se pudo eliminar el permiso SICT');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('SICT', id, 'DELETE', {}, usuarioId, connection);
      return true;
    });
  }
}

module.exports = new SictService();