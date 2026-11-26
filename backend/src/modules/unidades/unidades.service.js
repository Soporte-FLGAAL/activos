const unidadesRepository = require('./unidades.repository');
const uploadRepository = require('../upload/upload.repository');
const { withTransaction } = require('../../utils/transaction');
const { registrarMovimiento } = require('../../utils/audit');
const { existeRegistro } = require('../../utils/validators');

class UnidadesService {
  async listar(filters) {
    return unidadesRepository.findAll(filters);
  }

    async contar(filters) {
    return unidadesRepository.count(filters);
  }

  async _validarEmpresaActualParaEscritura(id, empresaId = null) {
    if (empresaId == null) return;
    const unidad = await this.obtener(id);
    if (Number(unidad.Uni_empresa_actual) !== Number(empresaId)) {
      const error = new Error(
        'La empresa propietaria conserva acceso de consulta, pero la administración de la unidad corresponde a la empresa actual.'
      );
      error.status = 403;
      throw error;
    }
  }

  async obtener(id, empresaId = null) {
    const unidad = await unidadesRepository.findById(id, empresaId);
    if (!unidad) {
      const error = new Error('Unidad no encontrada');
      error.status = 404;
      throw error;
    }
    return unidad;
  }

  async crear(data, usuarioId, empresaId = null, esAdminGlobal = false) {
    // Validaciones de FK
    const fkMap = [
      ['Tipo_unidad', 'TpU_id', data.tipoId, 'Tipo de unidad'],
      ['Estado_unidad', 'EsU_id', data.estadoId, 'Estado de unidad'],
      ['Combustible', 'Com_id', data.combustibleId, 'Combustible'],
      ['Empresas', 'Emp_id', data.propietarioId, 'Propietario'],
      ['Periodos', 'Per_id', data.periodoVerificacionMecanicaId, 'Periodo verificación mecánica'],
      ['Periodos', 'Per_id', data.periodoVerificacionContaminantesId, 'Periodo verificación contaminantes'],
    ];
    for (const [tabla, campo, valor, nombre] of fkMap) {
      if (valor !== undefined && !(await existeRegistro(tabla, campo, valor))) {
        const error = new Error(`${nombre} no existe`);
        error.status = 422;
        throw error;
      }
    }

    // Determinar empresa final según el tipo de usuario
    let empresaActualFinal;
    if (esAdminGlobal) {
      // Admin global: puede elegir cualquier empresa
      if (!data.empresaActualId) {
        const error = new Error('Debe especificar empresaActualId');
        error.status = 400;
        throw error;
      }
      if (!(await existeRegistro('Empresas', 'Emp_id', data.empresaActualId))) {
        const error = new Error('La empresa actual no existe');
        error.status = 422;
        throw error;
      }
      empresaActualFinal = data.empresaActualId;
    } else {
      // Usuario normal: la empresa del body debe coincidir con la del usuario
      if (!empresaId) {
        const error = new Error('No se pudo determinar la empresa del usuario');
        error.status = 400;
        throw error;
      }
      if (data.empresaActualId && Number(data.empresaActualId) !== Number(empresaId)) {
        const error = new Error('No tiene permisos para crear unidades en otra empresa');
        error.status = 403;
        throw error;
      }
      empresaActualFinal = empresaId;
    }

    // Regla: solo ADMIN_GLOBAL puede asignar un propietario distinto a su propia empresa
    if (!esAdminGlobal) {
      if (!empresaId) {
        const error = new Error('No se pudo determinar la empresa del usuario');
        error.status = 400;
        throw error;
      }
      if (Number(data.propietarioId) !== Number(empresaId)) {
        const error = new Error('No tiene permisos para asignar propietarios externos');
        error.status = 403;
        throw error;
      }
    }
    
    // Construir dbData
    const dbData = this._toDbData(data);
    dbData.Uni_empresa_actual = empresaActualFinal;

    return withTransaction(async (connection) => {
      const [result] = await connection.query('INSERT INTO Unidades SET ?', dbData);
      const nuevoId = result.insertId;
      await registrarMovimiento('Unidades', nuevoId, 'INSERT', dbData, usuarioId, connection);
      return nuevoId;
    }).then((id) => this.obtener(id));
  }

  async actualizar(id, data, usuarioId, empresaId = null) {
    await this._validarEmpresaActualParaEscritura(id, empresaId);

    const dbData = this._toDbData(data, true);

    // Defensa adicional por si alguien manipula el JSON
    delete dbData.Uni_empresa_actual;
    delete dbData.Uni_propietario;

    if (Object.keys(dbData).length === 0) {
      const error = new Error('No hay campos para actualizar');
      error.status = 400;
      throw error;
    }

    return withTransaction(async (connection) => {
      const ok = await unidadesRepository.update(id, dbData, empresaId, connection);
      if (!ok) {
        const error = new Error('No se pudo actualizar la unidad');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Unidades', id, 'UPDATE', dbData, usuarioId, connection);
      return true;
    }).then(() => this.obtener(id, empresaId));
  }

  async actualizarCampo(id, { campo, valor }, usuarioId, empresaId = null) {
        // Bloqueo explícito del campo empresa en este endpoint
    if (campo === 'Uni_empresa_actual') {
      const error = new Error(
        'El cambio de empresa debe realizarse mediante el endpoint /cambiar-empresa'
      );
      error.status = 400;
      throw error;
    }

    await this._validarEmpresaActualParaEscritura(id, empresaId);
    // Validar que el campo sea permitido y el valor adecuado según el campo
    if (campo === 'Uni_status') {
      if (!['ALTA', 'BAJA'].includes(valor)) {
        const error = new Error('Valor de status inválido');
        error.status = 422;
        throw error;
      }
    }

    return withTransaction(async (connection) => {
      const [result] = await connection.query(
        `UPDATE Unidades SET ${campo} = ? WHERE Uni_id = ?${empresaId ? ' AND Uni_empresa_actual = ?' : ''}`,
        empresaId ? [valor, id, empresaId] : [valor, id]
      );
      if (result.affectedRows === 0) {
        const error = new Error('No se pudo actualizar el campo');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Unidades', id, 'UPDATE', { campo, valor }, usuarioId, connection);
      return true;
    }).then(() => this.obtener(id, empresaId));
  }

  async cambiarPropietario(id, { propietarioId, motivo }, usuarioId) {
    // Validar que el nuevo propietario exista
    if (!(await existeRegistro('Empresas', 'Emp_id', propietarioId))) {
      const error = new Error('La empresa propietaria no existe');
      error.status = 422;
      throw error;
    }

    // Se obtiene sin filtro de empresa (solo ADMIN_GLOBAL llega aquí)
    const unidad = await this.obtener(id);
    const propietarioAnterior = unidad.Uni_propietario;

    if (propietarioAnterior === propietarioId) {
      const error = new Error('La unidad ya tiene ese propietario');
      error.status = 409;
      throw error;
    }

    return withTransaction(async (connection) => {
      await connection.query(
        'UPDATE Unidades SET Uni_propietario = ? WHERE Uni_id = ?',
        [propietarioId, id]
      );

      await registrarMovimiento(
        'Unidades',
        id,
        'UPDATE',
        {
          campo: 'Uni_propietario',
          propietarioAnterior,
          propietarioNuevo: propietarioId,
          motivo: motivo || null,
        },
        usuarioId,
        connection
      );

      return true;
    }).then(() => this.obtener(id));
  }

  async cambiarEmpresa(id, { empresaDestinoId, estadoId }, usuarioId) {
    const resultado = await withTransaction(async (connection) => {
      const [destinoRows] = await connection.query(
        'SELECT Emp_id FROM Empresas WHERE Emp_id = ? LIMIT 1',
        [empresaDestinoId]
      );
      if (destinoRows.length === 0) {
        const error = new Error('La empresa destino no existe');
        error.status = 422;
        throw error;
      }

      if (estadoId !== undefined) {
        const [estadoRows] = await connection.query(
          'SELECT EsU_id FROM Estado_unidad WHERE EsU_id = ? LIMIT 1',
          [estadoId]
        );
        if (estadoRows.length === 0) {
          const error = new Error('El estado indicado no existe');
          error.status = 422;
          throw error;
        }
      }

      const [unidadRows] = await connection.query(
        `SELECT Uni_id, Uni_no_economico, Uni_empresa_actual
         FROM Unidades
         WHERE Uni_id = ?
         FOR UPDATE`,
        [id]
      );
      const unidad = unidadRows[0];
      if (!unidad) {
        const error = new Error('Unidad no encontrada');
        error.status = 404;
        throw error;
      }

      const empresaAnterior = Number(unidad.Uni_empresa_actual);
      const empresaNueva = Number(empresaDestinoId);
      if (empresaAnterior === empresaNueva) {
        const error = new Error('La unidad ya pertenece a esa empresa');
        error.status = 409;
        throw error;
      }

      // Obtener una sola vez cada placa vinculada a las tarjetas de esta unidad.
      const [placas] = await connection.query(
        `SELECT p.Pla_id, p.Pla_placas, p.Pla_empresa_actual
         FROM Placas p
         WHERE p.Pla_id IN (
           SELECT DISTINCT tc.TC_placas_id
           FROM Tarjeta_circulacion tc
           WHERE tc.TC_unidad_id = ?
         )
         ORDER BY p.Pla_id
         FOR UPDATE`,
        [id]
      );

      // Una placa no puede cambiar de empresa si también está ligada a otra unidad.
      // Evita romper el expediente histórico de la otra unidad.
      for (const placa of placas) {
        const [otrasUnidades] = await connection.query(
          `SELECT DISTINCT u.Uni_id, u.Uni_no_economico
           FROM Tarjeta_circulacion tc
           INNER JOIN Unidades u ON u.Uni_id = tc.TC_unidad_id
           WHERE tc.TC_placas_id = ?
             AND tc.TC_unidad_id <> ?
           LIMIT 1`,
          [placa.Pla_id, id]
        );
        if (otrasUnidades.length > 0) {
          const otra = otrasUnidades[0];
          const error = new Error(
            `No se puede transferir automáticamente la placa ${placa.Pla_placas}: también está vinculada a la unidad ${otra.Uni_no_economico || otra.Uni_id}. Revisa esa relación antes de volver a intentar el traspaso.`
          );
          error.status = 409;
          throw error;
        }
      }

      // Crear/recuperar el tipo de movimiento sin requerir una actualización manual
      // del catálogo en instalaciones que ya están operando.
      await connection.query(
        'INSERT IGNORE INTO Tipo_movimiento_placa (TpMP_nombre) VALUES (?)',
        ['TRASPASO']
      );
      const [tipoMovimientoRows] = await connection.query(
        'SELECT TpMP_id FROM Tipo_movimiento_placa WHERE TpMP_nombre = ? LIMIT 1',
        ['TRASPASO']
      );
      if (tipoMovimientoRows.length === 0) {
        const error = new Error('No se pudo preparar el tipo de movimiento TRASPASO');
        error.status = 500;
        throw error;
      }
      const tipoMovimientoTraspaso = tipoMovimientoRows[0].TpMP_id;

      const placasTransferidas = [];
      const placasYaEnDestino = [];
      for (const placa of placas) {
        const empresaPlacaAnterior = Number(placa.Pla_empresa_actual);
        if (empresaPlacaAnterior === empresaNueva) {
          placasYaEnDestino.push(Number(placa.Pla_id));
          continue;
        }

        const [updateResult] = await connection.query(
          'UPDATE Placas SET Pla_empresa_actual = ? WHERE Pla_id = ?',
          [empresaNueva, placa.Pla_id]
        );
        if (updateResult.affectedRows === 0) {
          const error = new Error(`No se pudo transferir la placa ${placa.Pla_placas || placa.Pla_id}`);
          error.status = 500;
          throw error;
        }

        // El movimiento queda registrado en el historial propio de la placa.
        // El costo es cero y el comprobante es opcional para un traspaso administrativo.
        await connection.query(
          `INSERT INTO Detalle_placas
             (DP_placas_id, DP_tipo_movimiento, DP_costo, DP_fecha, DP_url)
           VALUES (?, ?, 0, CURDATE(), NULL)`,
          [placa.Pla_id, tipoMovimientoTraspaso]
        );

        await registrarMovimiento(
          'Placas',
          placa.Pla_id,
          'UPDATE',
          {
            campo: 'Pla_empresa_actual',
            empresaAnterior: empresaPlacaAnterior,
            empresaNueva,
            motivo: `Traspaso automático junto con la unidad ${unidad.Uni_no_economico || id}`,
            tipoMovimiento: 'TRASPASO',
          },
          usuarioId,
          connection
        );
        placasTransferidas.push(Number(placa.Pla_id));
      }

      const campos = ['Uni_empresa_actual = ?'];
      const valores = [empresaNueva];
      if (estadoId !== undefined) {
        campos.push('Uni_estado = ?');
        valores.push(estadoId);
      }
      valores.push(id);

      const [unitUpdate] = await connection.query(
        `UPDATE Unidades SET ${campos.join(', ')} WHERE Uni_id = ?`,
        valores
      );
      if (unitUpdate.affectedRows === 0) {
        const error = new Error('No se pudo actualizar la empresa de la unidad');
        error.status = 500;
        throw error;
      }

      // Reasignar la titularidad documental solo cuando el archivo no está
      // compartido por registros ajenos a esta unidad o a sus placas transferidas.
      const documentosReasignados = await uploadRepository.transferUnsharedFilesForUnit(
        id,
        empresaNueva,
        connection
      );

      await registrarMovimiento(
        'Unidades',
        id,
        'UPDATE',
        {
          campo: 'Uni_empresa_actual',
          empresaAnterior,
          empresaNueva,
          estadoNuevo: estadoId,
          placasTransferidas,
          placasYaEnDestino,
          documentosReasignados: documentosReasignados.length,
        },
        usuarioId,
        connection
      );

      return {
        placasTransferidas,
        placasYaEnDestino,
        documentosReasignados: documentosReasignados.length,
        empresaAnterior,
        empresaNueva,
      };
    });

    // El registro se consulta después del COMMIT para devolver los datos actuales.
    const unidad = await this.obtener(id);
    return { ...resultado, unidad };
  }

  async eliminar(id, usuarioId, empresaId = null) {
    await this._validarEmpresaActualParaEscritura(id, empresaId);

    return withTransaction(async (connection) => {
      const ok = await unidadesRepository.delete(id, empresaId, connection);
      if (!ok) {
        const error = new Error('No se pudo eliminar la unidad');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Unidades', id, 'DELETE', {}, usuarioId, connection);
      return true;
    });
  }

  async totalPorEmpresa(empresaId) {
    return unidadesRepository.countByEmpresa(empresaId);
  }

  async resumenPorEmpresa(empresaId) {
    return unidadesRepository.getResumen(empresaId);
  }

  _toDbData(data, isUpdate = false) {
    const map = {
      noEconomico: 'Uni_no_economico',
      status: 'Uni_status',
      tipoId: 'Uni_tipo',
      estadoId: 'Uni_estado',
      combustibleId: 'Uni_combustible',
      noSerie: 'Uni_no_serie',
      noMotor: 'Uni_no_motor',
      anioModelo: 'Uni_anio_modelo',
      modelo: 'Uni_modelo',
      marca: 'Uni_marca',
      ejes: 'Uni_ejes',
      llantas: 'Uni_llantas',
      viapass: 'Uni_viapass',
      fechaAltaSCT: 'Uni_fecha_alta_SCT',
      valorFactura: 'Uni_valor_factura',
      facturaUrl: 'Uni_factura_url',
      fechaVerificacionMecanica: 'Uni_fecha_verificacion_mecanica',
      costoVerificacionMecanica: 'Uni_costo_verificacion_mecanica',
      periodoVerificacionMecanicaId: 'Uni_periodo_verificacion_mecanica',
      fechaVerificacionContaminantes: 'Uni_fecha_verificacion_contaminantes',
      costoVerificacionContaminantes: 'Uni_costo_verificacion_contaminantes',
      periodoVerificacionContaminantesId: 'Uni_periodo_verificacion_contaminantes',
      urlVerificacionContaminantes: 'Uni_url_verificacion_contaminantes',
      urlVerificacionMecanica: 'Uni_url_verificacion_mecanica',
    };

    if (!isUpdate) {
      map.propietarioId = 'Uni_propietario';
    }

    const dbData = {};
    for (const key in data) {
      if (map[key]) {
        dbData[map[key]] = data[key];
      }
    }
    return dbData;
  }
}

module.exports = new UnidadesService();