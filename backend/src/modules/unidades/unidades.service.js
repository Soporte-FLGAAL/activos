const unidadesRepository = require('./unidades.repository');
const { registrarMovimiento } = require('../../utils/audit');

class UnidadesService {
  async listar(filters) {
    return unidadesRepository.findAll(filters);
  }

    async contar(filters) {
    return unidadesRepository.count(filters);
  }

  async obtener(id) {
    const unidad = await unidadesRepository.findById(id);
    if (!unidad) {
      const error = new Error('Unidad no encontrada');
      error.status = 404;
      throw error;
    }
    return unidad;
  }

  async crear(data, usuarioId) {
    const dbData = this._toDbData(data);
    return withTransaction(async (connection) => {
      const [result] = await connection.query('INSERT INTO Unidades SET ?', dbData);
      const nuevoId = result.insertId;
      await registrarMovimiento('Unidades', nuevoId, 'INSERT', dbData, usuarioId, connection);
      return nuevoId;
    }).then((id) => this.obtener(id));
  }

  async actualizar(id, data, usuarioId, empresaId = null) {
    await this.obtener(id, empresaId);

    const dbData = this._toDbData(data, true);
    // El cambio de empresa NO puede venir por este endpoint
    delete dbData.Uni_empresa_actual;

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

  async actualizarCampo(id, { campo, valor }, usuarioId) {
        // Bloqueo explícito del campo empresa en este endpoint
    if (campo === 'Uni_empresa_actual') {
      const error = new Error(
        'El cambio de empresa debe realizarse mediante el endpoint /cambiar-empresa'
      );
      error.status = 400;
      throw error;
    }

    await this.obtener(id, empresaId);
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

    async cambiarEmpresa(id, { empresaDestinoId, estadoId }, usuarioId) {
    // Validar que la empresa destino exista
    if (!(await existeRegistro('Empresas', 'Emp_id', empresaDestinoId))) {
      const error = new Error('La empresa destino no existe');
      error.status = 422;
      throw error;
    }
    if (estadoId && !(await existeRegistro('Estado_unidad', 'EsU_id', estadoId))) {
      const error = new Error('El estado indicado no existe');
      error.status = 422;
      throw error;
    }

    // Obtener la unidad actual (sin filtro de empresa: solo ADMIN_GLOBAL llega aquí)
    const unidad = await this.obtener(id);
    const empresaAnterior = unidad.Uni_empresa_actual;

    if (empresaAnterior === empresaDestinoId) {
      const error = new Error('La unidad ya pertenece a esa empresa');
      error.status = 409;
      throw error;
    }

    return withTransaction(async (connection) => {
      // Actualizar empresa actual y opcionalmente el estado
      const campos = ['Uni_empresa_actual = ?'];
      const valores = [empresaDestinoId];
      if (estadoId) {
        campos.push('Uni_estado = ?');
        valores.push(estadoId);
      }
      valores.push(id);

      await connection.query(
        `UPDATE Unidades SET ${campos.join(', ')} WHERE Uni_id = ?`,
        valores
      );

      // Auditoría con detalle del cambio
      await registrarMovimiento(
        'Unidades',
        id,
        'UPDATE',
        {
          campo: 'Uni_empresa_actual',
          empresaAnterior,
          empresaNueva: empresaDestinoId,
          estadoNuevo: estadoId || undefined,
        },
        usuarioId,
        connection
      );

      return true;
    }).then(() => this.obtener(id));
  }

  async eliminar(id, usuarioId, empresaId = null) {
    await this.obtener(id, empresaId);

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
      propietarioId: 'Uni_propietario',
      empresaActualId: 'Uni_empresa_actual',
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