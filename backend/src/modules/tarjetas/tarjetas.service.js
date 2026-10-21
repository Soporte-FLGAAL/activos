const tarjetasRepository = require('./tarjetas.repository');
const { registrarMovimiento } = require('../../utils/audit');
const { existeRegistro } = require('../../utils/validators');
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

  _requiereAdminGlobal(esAdminGlobal) {
    if (!esAdminGlobal) {
      const error = new Error(
        'Solo un administrador global puede gestionar tarjetas de circulación'
      );
      error.status = 403;
      throw error;
    }
  }

  async crear(data, usuarioId, esAdminGlobal = false) {
    this._requiereAdminGlobal(esAdminGlobal);

    // Validaciones de FK básicas
    if (!(await existeRegistro('Unidades', 'Uni_id', data.unidadId))) {
      const error = new Error('La unidad no existe');
      error.status = 422;
      throw error;
    }
    if (!(await existeRegistro('Tipo_tarjeta', 'TpT_id', data.tipoId))) {
      const error = new Error('El tipo de tarjeta no existe');
      error.status = 422;
      throw error;
    }
    if (!(await existeRegistro('Placas', 'Pla_id', data.placasId))) {
      const error = new Error('La placa no existe');
      error.status = 422;
      throw error;
    }

    const dbData = {
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
      TC_costo_reposicion: data.costoReposicion || null,
      TC_url: data.url,
      TC_url_reposicion: data.urlReposicion || null,
    };

    return withTransaction(async (connection) => {
    const [result] = await connection.query('INSERT INTO Tarjeta_circulacion SET ?', dbData);
    const nuevoId = result.insertId;

    await registrarMovimiento('Tarjeta_circulacion', nuevoId,'INSERT',dbData,usuarioId,connection);

    return nuevoId;
    }).then((id) => this.obtener(id));
  }

  async crearTarjetaConCotejos(dataTarjeta, cotejos, usuarioId, esAdminGlobal = false) {
    this._requiereAdminGlobal(esAdminGlobal);

    // Validaciones de FK
    if (!(await existeRegistro('Unidades', 'Uni_id', dataTarjeta.unidadId))) {
      const error = new Error('La unidad no existe');
      error.status = 422;
      throw error;
    }
    if (!(await existeRegistro('Tipo_tarjeta', 'TpT_id', dataTarjeta.tipoId))) {
      const error = new Error('El tipo de tarjeta no existe');
      error.status = 422;
      throw error;
    }
    if (!(await existeRegistro('Placas', 'Pla_id', dataTarjeta.placasId))) {
      const error = new Error('La placa no existe');
      error.status = 422;
      throw error;
    }

    return withTransaction(async (connection) => {
      const [result] = await connection.query(
        `INSERT INTO Tarjeta_circulacion
        (TC_tarjeta, TC_unidad_id, TC_costo, TC_tipo, TC_status, TC_no_original,
          TC_placas_id, TC_fecha_obtencion, TC_fecha_vencimiento,
          TC_fecha_reposicion, TC_costo_reposicion,
          TC_url, TC_url_reposicion)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          dataTarjeta.tarjeta,
          dataTarjeta.unidadId,
          dataTarjeta.costo,
          dataTarjeta.tipoId,
          dataTarjeta.status,
          dataTarjeta.noOriginal || null,
          dataTarjeta.placasId,
          dataTarjeta.fechaObtencion,
          dataTarjeta.fechaVencimiento || null,
          dataTarjeta.fechaReposicion || null,
          dataTarjeta.costoReposicion ?? null,
          dataTarjeta.url,
          dataTarjeta.urlReposicion || null,
        ]
      );
      const tarjetaId = result.insertId;

      // Insertar cotejos si existen
      if (cotejos && cotejos.length > 0) {
        for (const cotejo of cotejos) {
          await connection.query(
            `INSERT INTO Cotejos (Cot_tarjeta_id, Cot_tarjeta_cotejo, Cot_fecha)
            VALUES (?,?,?)`,
            [tarjetaId, cotejo.tarjetaCotejo, cotejo.fecha]
          );
        }
      }

      // Auditoría dentro de la transacción
      await registrarMovimiento('Tarjeta_circulacion', tarjetaId, 'INSERT', { ...dataTarjeta, cotejos }, usuarioId, connection);

      return tarjetaId;
    }).then((id) => this.obtener(id));
  }

  async actualizar(id, data, usuarioId, esAdminGlobal = false) {
    this._requiereAdminGlobal(esAdminGlobal);
    await this.obtener(id);

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
    for (const key in data) if (map[key]) dbData[map[key]] = data[key];

    if (Object.keys(dbData).length === 0) {
      const error = new Error('No hay campos para actualizar');
      error.status = 400;
      throw error;
    }

    return withTransaction(async (connection) => {
      if (data.unidadId !== undefined) {
        const ok = await existeRegistro('Unidades', 'Uni_id', data.unidadId);
        if (!ok) {
          const error = new Error('La unidad no existe');
          error.status = 422;
          throw error;
        }
      }

      if (data.tipoId !== undefined) {
        const ok = await existeRegistro('Tipo_tarjeta', 'TpT_id', data.tipoId);
        if (!ok) {
          const error = new Error('El tipo de tarjeta no existe');
          error.status = 422;
          throw error;
        }
      }

      if (data.placasId !== undefined) {
        const ok = await existeRegistro('Placas', 'Pla_id', data.placasId);
        if (!ok) {
          const error = new Error('La placa no existe');
          error.status = 422;
          throw error;
        }
      }

      const ok = await tarjetasRepository.update(id, dbData, null, connection);
      if (!ok) {
        const error = new Error('No se pudo actualizar la tarjeta');
        error.status = 500;
        throw error;
      }

      await registrarMovimiento('Tarjeta_circulacion', id, 'UPDATE', dbData, usuarioId, connection);
      return true;
    }).then(() => this.obtener(id, empresaId));
  }

  async actualizarUrl(id, url, usuarioId, esAdminGlobal = false) {
    this._requiereAdminGlobal(esAdminGlobal);
    await this.obtener(id);
    return withTransaction(async (connection) => {
      const ok = await tarjetasRepository.updateUrl(id, url, null, connection);
      if (!ok) {
        const error = new Error('No se pudo actualizar la URL');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Tarjeta_circulacion',id,'UPDATE',{ campo: 'TC_url', valor: url },usuarioId,connection);
      return true;
    }).then(() => this.obtener(id));
  }

  async eliminar(id, usuarioId, esAdminGlobal = false) {
    this._requiereAdminGlobal(esAdminGlobal);
    await this.obtener(id);
    return withTransaction(async (connection) => {
      const ok = await tarjetasRepository.delete(id, null, connection);
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