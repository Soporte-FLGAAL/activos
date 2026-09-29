const incisosRepository = require('./incisos.repository');
const { withTransaction } = require('../../utils/transaction');
const { registrarMovimiento } = require('../../utils/audit');
const { existeRegistro } = require('../../utils/validators');

class IncisosService {
  async listar(filters) { return incisosRepository.findAll(filters); }
  async contar(filters) { return incisosRepository.count(filters); }

  async obtener(id, empresaId = null) {
    const inciso = await incisosRepository.findById(id, empresaId);
    if (!inciso) {
      const error = new Error('Inciso no encontrado');
      error.status = 404;
      throw error;
    }
    return inciso;
  }

  async crear(data, usuarioId, empresaId = null) {
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

    return withTransaction(async (connection) => {
      if (empresaId) {
        const [row] = await connection.query(
          `SELECT u.Uni_empresa_actual
           FROM Endoso e
           JOIN Polizas p ON e.End_poliza = p.Pol_id
           JOIN Unidades u ON p.Pol_unidad_id = u.Uni_id
           WHERE e.End_id = ?`,
          [data.endosoId]
        );
        if (row.length === 0 || row[0].Uni_empresa_actual !== empresaId) {
          const error = new Error('El endoso no pertenece a la empresa');
          error.status = 403;
          throw error;
        }
      }
      const nuevoId = await incisosRepository.create(dbData, connection);
      await registrarMovimiento('Inciso', nuevoId, 'INSERT', dbData, usuarioId, connection);
      return nuevoId;
    }).then((id) => this.obtener(id, empresaId));
  }

  async actualizar(id, data, usuarioId, empresaId = null) {
    await this.obtener(id, empresaId);
    const map = { inciso: 'Inc_inciso', endosoId: 'Inc_endoso', url: 'Inc_url' };
    const dbData = {};
    for (const key in data) if (map[key]) dbData[map[key]] = data[key];

    return withTransaction(async (connection) => {
      const ok = await incisosRepository.update(id, dbData, empresaId, connection);
      if (!ok) {
        const error = new Error('No se pudo actualizar el inciso');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Inciso', id, 'UPDATE', dbData, usuarioId, connection);
      return true;
    }).then(() => this.obtener(id, empresaId));
  }

  async eliminar(id, usuarioId, empresaId = null) {
    await this.obtener(id, empresaId);
    return withTransaction(async (connection) => {
      const ok = await incisosRepository.delete(id, empresaId, connection);
      if (!ok) {
        const error = new Error('No se pudo eliminar el inciso');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Inciso', id, 'DELETE', {}, usuarioId, connection);
      return true;
    });
  }
}

module.exports = new IncisosService();