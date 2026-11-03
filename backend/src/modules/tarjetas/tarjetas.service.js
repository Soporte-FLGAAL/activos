const tarjetasRepository = require('./tarjetas.repository');
const { registrarMovimiento } = require('../../utils/audit');
const { withTransaction } = require('../../utils/transaction');

class TarjetasService {
  async listar(filters) {
    return tarjetasRepository.findAll(filters);
  }

  async contar(filters) {
    return tarjetasRepository.count(filters);
  }

  async obtener(id, empresaId = null) {
    const tarjeta = await tarjetasRepository.findById(id, empresaId);
    if (!tarjeta) {
      const error = new Error('Tarjeta de circulación no encontrada');
      error.status = 404;
      throw error;
    }
    return tarjeta;
  }

  async _validarTipo(tipoId, connection) {
    const [rows] = await connection.query(
      'SELECT 1 FROM Tipo_tarjeta WHERE TpT_id = ?',
      [tipoId]
    );
    if (rows.length === 0) {
      const error = new Error('El tipo de tarjeta no existe');
      error.status = 422;
      throw error;
    }
  }

  async _validarUnidadYPlaca(unidadId, placasId, empresaId = null, connection) {
    const [unidadRows] = await connection.query(
      'SELECT Uni_empresa_actual FROM Unidades WHERE Uni_id = ?',
      [unidadId]
    );
    if (unidadRows.length === 0) {
      const error = new Error('La unidad no existe');
      error.status = 422;
      throw error;
    }

    const [placaRows] = await connection.query(
      'SELECT Pla_empresa_actual FROM Placas WHERE Pla_id = ?',
      [placasId]
    );
    if (placaRows.length === 0) {
      const error = new Error('La placa no existe');
      error.status = 422;
      throw error;
    }

    const unidadEmpresa = Number(unidadRows[0].Uni_empresa_actual);
    const placaEmpresa = Number(placaRows[0].Pla_empresa_actual);
    if (unidadEmpresa !== placaEmpresa) {
      const error = new Error('La unidad y la placa deben pertenecer a la misma empresa para asociarlas a una tarjeta.');
      error.status = 422;
      throw error;
    }
    if (empresaId && (unidadEmpresa !== Number(empresaId) || placaEmpresa !== Number(empresaId))) {
      const error = new Error('La unidad o la placa no pertenecen a la empresa activa.');
      error.status = 403;
      throw error;
    }
  }

  _toDbData(data) {
    return {
      TC_tarjeta: data.tarjeta,
      TC_unidad_id: data.unidadId,
      TC_costo: data.costo,
      TC_tipo: data.tipoId,
      TC_status: data.status,
      TC_no_original: data.noOriginal || null,
      TC_placas_id: data.placasId,
      TC_fecha_obtencion: data.fechaObtencion,
      TC_fecha_vencimiento: data.fechaVencimiento || null,
      TC_fecha_reposicion: data.fechaReposicion || null,
      TC_costo_reposicion: data.costoReposicion ?? null,
      TC_url: data.url,
      TC_url_reposicion: data.urlReposicion || null,
    };
  }

  async crear(data, usuarioId, empresaId = null) {
    return withTransaction(async (connection) => {
      await this._validarUnidadYPlaca(data.unidadId, data.placasId, empresaId, connection);
      await this._validarTipo(data.tipoId, connection);

      const dbData = this._toDbData(data);
      const [result] = await connection.query(
        'INSERT INTO Tarjeta_circulacion SET ?',
        dbData
      );
      const nuevoId = result.insertId;
      await registrarMovimiento('Tarjeta_circulacion', nuevoId, 'INSERT', dbData, usuarioId, connection);
      return nuevoId;
    }).then((id) => this.obtener(id, empresaId));
  }

  async crearTarjetaConCotejos(dataTarjeta, cotejos = [], usuarioId, empresaId = null) {
    return withTransaction(async (connection) => {
      await this._validarUnidadYPlaca(dataTarjeta.unidadId, dataTarjeta.placasId, empresaId, connection);
      await this._validarTipo(dataTarjeta.tipoId, connection);

      const dbData = this._toDbData(dataTarjeta);
      const [result] = await connection.query(
        'INSERT INTO Tarjeta_circulacion SET ?',
        dbData
      );
      const tarjetaId = result.insertId;

      for (const cotejo of (cotejos || [])) {
        await connection.query(
          'INSERT INTO Cotejos (Cot_tarjeta_id, Cot_tarjeta_cotejo, Cot_fecha) VALUES (?,?,?)',
          [tarjetaId, cotejo.tarjetaCotejo, cotejo.fecha]
        );
      }

      await registrarMovimiento(
        'Tarjeta_circulacion',
        tarjetaId,
        'INSERT',
        { ...dbData, cotejos },
        usuarioId,
        connection
      );
      return tarjetaId;
    }).then((id) => this.obtener(id, empresaId));
  }

  async actualizar(id, data, usuarioId, empresaId = null) {
    return withTransaction(async (connection) => {
      const actual = await tarjetasRepository.findById(id, empresaId, connection);
      if (!actual) {
        const error = new Error('Tarjeta de circulación no encontrada');
        error.status = 404;
        throw error;
      }

      const map = {
        tarjeta: 'TC_tarjeta',
        unidadId: 'TC_unidad_id',
        costo: 'TC_costo',
        tipoId: 'TC_tipo',
        status: 'TC_status',
        noOriginal: 'TC_no_original',
        placasId: 'TC_placas_id',
        fechaObtencion: 'TC_fecha_obtencion',
        fechaVencimiento: 'TC_fecha_vencimiento',
        fechaReposicion: 'TC_fecha_reposicion',
        costoReposicion: 'TC_costo_reposicion',
        url: 'TC_url',
        urlReposicion: 'TC_url_reposicion',
      };
      const dbData = {};
      for (const key in data) {
        if (map[key]) dbData[map[key]] = data[key] ?? null;
      }

      if (Object.keys(dbData).length === 0) {
        const error = new Error('No hay campos para actualizar');
        error.status = 400;
        throw error;
      }

      const unidadId = data.unidadId ?? actual.TC_unidad_id;
      const placasId = data.placasId ?? actual.TC_placas_id;
      await this._validarUnidadYPlaca(unidadId, placasId, empresaId, connection);
      if (data.tipoId !== undefined) await this._validarTipo(data.tipoId, connection);

      const ok = await tarjetasRepository.update(id, dbData, empresaId, connection);
      if (!ok) {
        const error = new Error('No se pudo actualizar la tarjeta');
        error.status = 500;
        throw error;
      }

      await registrarMovimiento('Tarjeta_circulacion', id, 'UPDATE', dbData, usuarioId, connection);
      return true;
    }).then(() => this.obtener(id, empresaId));
  }

  async actualizarUrl(id, url, usuarioId, empresaId = null) {
    await this.obtener(id, empresaId);
    return withTransaction(async (connection) => {
      const ok = await tarjetasRepository.updateUrl(id, url, empresaId, connection);
      if (!ok) {
        const error = new Error('No se pudo actualizar la URL');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Tarjeta_circulacion', id, 'UPDATE', { campo: 'TC_url', valor: url }, usuarioId, connection);
      return true;
    }).then(() => this.obtener(id, empresaId));
  }

  async eliminar(id, usuarioId, empresaId = null) {
    await this.obtener(id, empresaId);
    return withTransaction(async (connection) => {
      const ok = await tarjetasRepository.delete(id, empresaId, connection);
      if (!ok) {
        const error = new Error('No se pudo eliminar la tarjeta');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Tarjeta_circulacion', id, 'DELETE', {}, usuarioId, connection);
      return true;
    });
  }
}

module.exports = new TarjetasService();
