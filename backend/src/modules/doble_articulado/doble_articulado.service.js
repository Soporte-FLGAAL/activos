const dobleArticuladoRepository = require('./doble_articulado.repository');
const { validarEmpresaActual } = require('../../utils/empresa');
const { withTransaction } = require('../../utils/transaction');
const { registrarMovimiento } = require('../../utils/audit');
const { existeRegistro } = require('../../utils/validators');

class DobleArticuladoService {
  async listar(filters) { return dobleArticuladoRepository.findAll(filters); }
  async contar(filters) { return dobleArticuladoRepository.count(filters); }

  async obtener(id, empresaId = null) {
    const permiso = await dobleArticuladoRepository.findById(id, empresaId);
    if (!permiso) {
      const error = new Error('Permiso especial no encontrado');
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
      PDA_permiso: data.permiso,
      PDA_unidad_id: data.unidadId,
      PDA_fecha_obtencion: data.fechaObtencion,
      PDA_fecha_vencimiento: data.fechaVencimiento,
      PDA_url: data.url,
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
      const nuevoId = await dobleArticuladoRepository.create(dbData, connection);
      await registrarMovimiento('Doble_articulado', nuevoId, 'INSERT', dbData, usuarioId, connection);
      return nuevoId;
    }).then((id) => this.obtener(id, empresaId));
  }

  async actualizar(id, data, usuarioId, empresaId = null) {
    const actual = await this.obtener(id, empresaId);
    validarEmpresaActual(actual, empresaId, 'permiso especial');
    const map = {
      permiso: 'PDA_permiso',
      unidadId: 'PDA_unidad_id',
      fechaObtencion: 'PDA_fecha_obtencion',
      fechaVencimiento: 'PDA_fecha_vencimiento',
      url: 'PDA_url',
    };
    const dbData = {};
    for (const key in data) if (map[key]) dbData[map[key]] = data[key];

    return withTransaction(async (connection) => {
      // Si se cambia la unidad, validar que pertenezca a la empresa
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

      const ok = await dobleArticuladoRepository.update(id, dbData, empresaId, connection);
      if (!ok) {
        const error = new Error('No se pudo actualizar el permiso');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Doble_articulado', id, 'UPDATE', dbData, usuarioId, connection);
      return true;
    }).then(() => this.obtener(id, empresaId));
  }

  async eliminar(id, usuarioId, empresaId = null) {
    const actual = await this.obtener(id, empresaId);
    validarEmpresaActual(actual, empresaId, 'permiso especial');
    return withTransaction(async (connection) => {
      const ok = await dobleArticuladoRepository.delete(id, empresaId, connection);
      if (!ok) {
        const error = new Error('No se pudo eliminar el permiso');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Doble_articulado', id, 'DELETE', {}, usuarioId, connection);
      return true;
    });
  }
}

module.exports = new DobleArticuladoService();