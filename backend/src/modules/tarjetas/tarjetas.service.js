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

  async crear(data, usuarioId, empresaId = null) {
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
      // Validar pertenencia de la unidad a la empresa
      if (empresaId) {
        const [unidadRow] = await connection.query('SELECT Uni_empresa_actual FROM Unidades WHERE Uni_id = ?',
          [data.unidadId]
        );
        if (unidadRow.length === 0 || unidadRow[0].Uni_empresa_actual !== empresaId) {
          const error = new Error('La unidad no pertenece a la empresa');
          error.status = 403;
          throw error;
        }

        // Validar pertenencia de la placa a la empresa
        const [placaRow] = await connection.query('SELECT Pla_empresa_actual FROM Placas WHERE Pla_id = ?', [data.placasId]);
        if (placaRow.length === 0 || placaRow[0].Pla_empresa_actual !== empresaId) {
          const error = new Error('La placa no pertenece a la empresa');
          error.status = 403;
          throw error;
        }
      }

    const [result] = await connection.query('INSERT INTO Tarjeta_circulacion SET ?', dbData);
    const nuevoId = result.insertId;

    await registrarMovimiento('Tarjeta_circulacion', nuevoId,'INSERT',dbData,usuarioId,connection);

    return nuevoId;
    }).then((id) => this.obtener(id, empresaId));
  }

  async crearTarjetaConCotejos(dataTarjeta, cotejos, usuarioId, empresaId = null) {
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
      // Validar pertenencia a la empresa
      if (empresaId) {
        const [unidadRow] = await connection.query(
          'SELECT Uni_empresa_actual FROM Unidades WHERE Uni_id = ?',
          [dataTarjeta.unidadId]
        );
        if (unidadRow.length === 0 || unidadRow[0].Uni_empresa_actual !== empresaId) {
          const error = new Error('La unidad no pertenece a la empresa');
          error.status = 403;
          throw error;
        }

        const [placaRow] = await connection.query(
          'SELECT Pla_empresa_actual FROM Placas WHERE Pla_id = ?',
          [dataTarjeta.placasId]
        );
        if (placaRow.length === 0 || placaRow[0].Pla_empresa_actual !== empresaId) {
          const error = new Error('La placa no pertenece a la empresa');
          error.status = 403;
          throw error;
        }
      }

      // INSERT completo con todos los campos de reposición
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
    }).then((id) => this.obtener(id, empresaId));
  }

  async actualizar(id, data, usuarioId, empresaId = null) {
    // 1. Verificar existencia y pertenencia del registro actual
    await this.obtener(id, empresaId);

    // 2. Construir dbData solo con los campos enviados
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
      // 3. Validar FK solo si el campo fue enviado
      if (data.unidadId !== undefined) {
        const ok = await existeRegistro('Unidades', 'Uni_id', data.unidadId);
        if (!ok) {
          const error = new Error('La unidad no existe');
          error.status = 422;
          throw error;
        }
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
      }

      // 4. Actualizar
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
      await registrarMovimiento('Tarjeta_circulacion',id,'UPDATE',{ campo: 'TC_url', valor: url },usuarioId,connection);
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