const endososRepository = require('./endosos.repository');
const { withTransaction } = require('../../utils/transaction');
const { registrarMovimiento } = require('../../utils/audit');
const { existeRegistro } = require('../../utils/validators');

class EndososService {
  async listar(filters) { return endososRepository.findAll(filters); }
  async contar(filters) { return endososRepository.count(filters); }

  async obtener(id, empresaId = null) {
    const endoso = await endososRepository.findById(id, empresaId);
    if (!endoso) {
      const error = new Error('Endoso no encontrado');
      error.status = 404;
      throw error;
    }
    return endoso;
  }

  async crear(data, usuarioId, empresaId = null) {
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

    return withTransaction(async (connection) => {
      // Validar que la póliza pertenezca a la empresa
      if (empresaId) {
        const [row] = await connection.query(
          `SELECT u.Uni_empresa_actual
           FROM Polizas p
           JOIN Unidades u ON p.Pol_unidad_id = u.Uni_id
           WHERE p.Pol_id = ?`,
          [data.polizaId]
        );
        if (row.length === 0 || row[0].Uni_empresa_actual !== empresaId) {
          const error = new Error('La póliza no pertenece a la empresa');
          error.status = 403;
          throw error;
        }
      }
      const nuevoId = await endososRepository.create(dbData, connection);
      await registrarMovimiento('Endoso', nuevoId, 'INSERT', dbData, usuarioId, connection);
      return nuevoId;
    }).then((id) => this.obtener(id, empresaId));
  }

  async actualizar(id, data, usuarioId, empresaId = null) {
    await this.obtener(id, empresaId);
    const map = { endoso: 'End_endoso', polizaId: 'End_poliza', url: 'End_url' };
    const dbData = {};
    for (const key in data) if (map[key]) dbData[map[key]] = data[key];

    return withTransaction(async (connection) => {
      const ok = await endososRepository.update(id, dbData, empresaId, connection);
      if (!ok) {
        const error = new Error('No se pudo actualizar el endoso');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Endoso', id, 'UPDATE', dbData, usuarioId, connection);
      return true;
    }).then(() => this.obtener(id, empresaId));
  }

  async eliminar(id, usuarioId, empresaId = null) {
    await this.obtener(id, empresaId);
    return withTransaction(async (connection) => {
      const ok = await endososRepository.delete(id, empresaId, connection);
      if (!ok) {
        const error = new Error('No se pudo eliminar el endoso');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Endoso', id, 'DELETE', {}, usuarioId, connection);
      return true;
    });
  }
}

module.exports = new EndososService();