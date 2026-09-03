const polizasRepository = require('./polizas.repository');
const { registrarMovimiento } = require('../../utils/audit');
const { existeRegistro } = require('../../utils/validators');
const { withTransaction } = require('../../utils/transaction');

class PolizasService {
  async listar(filters) {
    return polizasRepository.findAll(filters);
  }

  async obtener(id) {
    const poliza = await polizasRepository.findById(id);
    if (!poliza) {
      const error = new Error('Póliza no encontrada');
      error.status = 404;
      throw error;
    }
    return poliza;
  }

  async crear(data) {
    const fks = [
      ['Aseguradoras', 'Ase_id', data.aseguradoraId, 'Aseguradora'],
      ['Unidades', 'Uni_id', data.unidadId, 'Unidad'],
      ['Tipo_poliza', 'TpP_id', data.tipoPolizaId, 'Tipo de póliza'],
    ];
    for (const [tabla, campo, valor, nombre] of fks) {
      if (valor && !(await existeRegistro(tabla, campo, valor))) {
        const error = new Error(`${nombre} no existe`);
        error.status = 422;
        throw error;
      }
    }

    const dbData = {
      Pol_poliza: data.poliza,
      Pol_aseguradora: data.aseguradoraId,
      Pol_unidad_id: data.unidadId,
      Pol_tipo_poliza: data.tipoPolizaId,
      Pol_fecha_inicio: data.fechaInicio,
      Pol_fecha_fin: data.fechaFin,
      Pol_costo: data.costo,
      Pol_url: data.url,
    };
    const nuevaPoliza = await polizasRepository.create(dbData);
    await registrarMovimiento('Polizas', nuevaPoliza.Pol_id, 'INSERT', dbData, usuarioId);
    return nuevaPoliza;
  }

  async crearPolizaConEndosos(dataPoliza, endosos, usuarioId) {
    // Validaciones de FK
    if (!(await existeRegistro('Aseguradoras', 'Ase_id', dataPoliza.aseguradoraId))) {
      const error = new Error('La aseguradora no existe');
      error.status = 422;
      throw error;
    }
    if (!(await existeRegistro('Unidades', 'Uni_id', dataPoliza.unidadId))) {
      const error = new Error('La unidad no existe');
      error.status = 422;
      throw error;
    }
    if (!(await existeRegistro('Tipo_poliza', 'TpP_id', dataPoliza.tipoPolizaId))) {
      const error = new Error('El tipo de póliza no existe');
      error.status = 422;
      throw error;
    }

    return withTransaction(async (connection) => {
      // Insertar póliza
      const [polizaResult] = await connection.query(
        `INSERT INTO Polizas (Pol_poliza, Pol_aseguradora, Pol_unidad_id, Pol_tipo_poliza, Pol_fecha_inicio, Pol_fecha_fin, Pol_costo, Pol_url)
         VALUES (?,?,?,?,?,?,?,?)`,
        [
          dataPoliza.poliza,
          dataPoliza.aseguradoraId,
          dataPoliza.unidadId,
          dataPoliza.tipoPolizaId,
          dataPoliza.fechaInicio,
          dataPoliza.fechaFin,
          dataPoliza.costo,
          dataPoliza.url,
        ]
      );
      const polizaId = polizaResult.insertId;

      // Insertar endosos y sus incisos
      if (endosos && endosos.length > 0) {
        for (const endoso of endosos) {
          const [endosoResult] = await connection.query(
            `INSERT INTO Endoso (End_endoso, End_poliza, End_url) VALUES (?,?,?)`,
            [endoso.endoso, polizaId, endoso.url]
          );
          const endosoId = endosoResult.insertId;

          if (endoso.incisos && endoso.incisos.length > 0) {
            for (const inciso of endoso.incisos) {
              await connection.query(
                `INSERT INTO Inciso (Inc_endoso, Inc_inciso, Inc_url) VALUES (?,?,?)`,
                [endosoId, inciso.inciso, inciso.url]
              );
            }
          }
        }
      }

      // Auditoría
      await registrarMovimiento('Polizas', polizaId, 'INSERT', { ...dataPoliza, endosos }, usuarioId, connection);

      return polizaId;
    });
  }

  async crearPolizaConEndosos(dataPoliza, endosos, usuarioId) {
    return withTransaction(async (connection) => {
      // Insertar póliza usando la conexión
      // Necesitaríamos modificar el repositorio para aceptar conexión, pero lo hacemos directamente aquí
      const [result] = await connection.query(
        `INSERT INTO Polizas 
         (Pol_poliza, Pol_aseguradora, Pol_unidad_id, Pol_tipo_poliza, Pol_fecha_inicio, Pol_fecha_fin, Pol_costo, Pol_url)
         VALUES (?,?,?,?,?,?,?,?)`,
        [dataPoliza.poliza, dataPoliza.aseguradoraId, dataPoliza.unidadId, dataPoliza.tipoPolizaId, dataPoliza.fechaInicio, dataPoliza.fechaFin, dataPoliza.costo, dataPoliza.url]
      );
      const polizaId = result.insertId;
      for (const endoso of endosos) {
        await connection.query(
          `INSERT INTO Endoso (End_endoso, End_poliza, End_url) VALUES (?,?,?)`,
          [endoso.endoso, polizaId, endoso.url]
        );
      }
      // Auditoría dentro de la transacción
      await connection.query(
        `INSERT INTO Movimientos (Mov_tabla_afectada, Mov_registro_afectado, Mov_accion, Mov_detalles, Mov_usu_id)
         VALUES ('Polizas', ?, (SELECT AcM_id FROM Acciones_movimiento WHERE AcM_nombre = 'INSERT'), ?, ?)`,
        [polizaId.toString(), JSON.stringify({ ...dataPoliza, endosos }), usuarioId]
      );
      return polizaId;
    });
  }

  async actualizar(id, data) {
    await this.obtener(id);
    const map = {
      poliza: 'Pol_poliza',
      aseguradoraId: 'Pol_aseguradora',
      unidadId: 'Pol_unidad_id',
      tipoPolizaId: 'Pol_tipo_poliza',
      fechaInicio: 'Pol_fecha_inicio',
      fechaFin: 'Pol_fecha_fin',
      costo: 'Pol_costo',
      url: 'Pol_url',
    };
    const dbData = {};
    for (const key in data) {
      if (map[key]) dbData[map[key]] = data[key];
    }
    const actualizada = await polizasRepository.update(id, dbData);
    await registrarMovimiento('Polizas', id, 'UPDATE', dbData, usuarioId);
    return actualizada;
  }

  async actualizarUrl(id, url) {
    await this.obtener(id);
    await polizasRepository.updateUrl(id, url);
    await registrarMovimiento('Polizas', id, 'UPDATE', { campo: 'Pol_url', valor: url }, usuarioId);
    return this.obtener(id);
  }

  async eliminar(id) {
    await this.obtener(id);
    const eliminado = await polizasRepository.delete(id);
    if (eliminado) {
      await registrarMovimiento('Polizas', id, 'DELETE', {}, usuarioId);
    }
    return eliminado;
  }
}

module.exports = new PolizasService();