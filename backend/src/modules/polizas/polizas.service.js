const polizasRepository = require('./polizas.repository');
const { registrarMovimiento } = require('../../utils/audit');
const { existeRegistro } = require('../../utils/validators');
const { withTransaction } = require('../../utils/transaction');

class PolizasService {
  async listar(filters) {
    return polizasRepository.findAll(filters);
  }

  async obtener(id, empresaId = null) {
    const poliza = await polizasRepository.findById(id, empresaId);
    if (!poliza) {
      const error = new Error('Póliza no encontrada');
      error.status = 404;
      throw error;
    }
    return poliza;
  }

  async crear(data, usuarioId, empresaId) {
    // Validaciones de FK
    if (!(await existeRegistro('Aseguradoras', 'Ase_id', data.aseguradoraId))) {
      const error = new Error('La aseguradora no existe');
      error.status = 422;
      throw error;
    }
    if (!(await existeRegistro('Unidades', 'Uni_id', data.unidadId))) {
      const error = new Error('La unidad no existe');
      error.status = 422;
      throw error;
    }
    if (!(await existeRegistro('Tipo_poliza', 'TpP_id', data.tipoPolizaId))) {
      const error = new Error('El tipo de póliza no existe');
      error.status = 422;
      throw error;
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
   
    return withTransaction(async (connection) => {
      // Validar pertenencia a la empresa dentro de la transacción
      if (empresaId) {
        const [unidadRows] = await connection.query(
          'SELECT Uni_empresa_actual FROM Unidades WHERE Uni_id = ?',
          [data.unidadId]
        );
        if (
          unidadRows.length === 0 ||
          unidadRows[0].Uni_empresa_actual !== empresaId
        ) {
          const error = new Error('La unidad no pertenece a la empresa');
          error.status = 403;
          throw error;
        }
      }

      // Insertar póliza
      const [result] = await connection.query('INSERT INTO Polizas SET ?', dbData);
      const polizaId = result.insertId;

      // Auditoría dentro de la transacción
      await registrarMovimiento('Polizas', polizaId, 'INSERT', dbData, usuarioId, connection);

        return polizaId;
    }).then((polizaId) => this.obtener(polizaId, empresaId));
  }

  async crearPolizaConEndosos(dataPoliza, endosos, usuarioId, empresaId = null) {
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
      if (empresaId) {
        const [unidadRows] = await connection.query(
          'SELECT Uni_empresa_actual FROM Unidades WHERE Uni_id = ?',
          [dataPoliza.unidadId]
        );
        if (unidadRows.length === 0 || unidadRows[0].Uni_empresa_actual !== empresaId) {
          const error = new Error('La unidad no pertenece a la empresa');
          error.status = 403;
          throw error;
        }
      }
      
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

  async actualizar(id, data, usuarioId, empresaId = null) {
    await this.obtener(id, empresaId);

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
    
    return withTransaction(async (connection) => {
      // Si se está cambiando la unidad, validar que pertenezca a la empresa
      if (data.unidadId && empresaId) {
        const [unidadRows] = await connection.query(
          'SELECT Uni_empresa_actual FROM Unidades WHERE Uni_id = ?',
          [data.unidadId]
        );
        if (
          unidadRows.length === 0 ||
          unidadRows[0].Uni_empresa_actual !== empresaId
        ) {
          const error = new Error('La unidad no pertenece a la empresa');
          error.status = 403;
          throw error;
        }
      }

      const [result] = await connection.query(
        'UPDATE Polizas SET ? WHERE Pol_id = ?',
        [dbData, id]
      );
      if (result.affectedRows === 0) {
        const error = new Error('No se pudo actualizar la póliza');
        error.status = 500;
        throw error;
      }

      await registrarMovimiento('Polizas', id, 'UPDATE', dbData, usuarioId, connection);

      return true;
    }).then(() => this.obtener(id, empresaId));
  }

  async actualizarUrl(id, url, usuarioId, empresaId = null) {
    await this.obtener(id, empresaId);
    const ok = await polizasRepository.updateUrl(id, url, empresaId);
    if (!ok) {
      const error = new Error('No se pudo actualizar la URL');
      error.status = 500;
      throw error;
    }
    await registrarMovimiento('Polizas', id, 'UPDATE', { campo: 'Pol_url', valor: url }, usuarioId);
    return this.obtener(id, empresaId);
  }

  async eliminar(id, usuarioId, empresaId = null) {
    await this.obtener(id, empresaId);
    const eliminado = await polizasRepository.delete(id, empresaId);
    if (eliminado) {
      await registrarMovimiento('Polizas', id, 'DELETE', {}, usuarioId);
    }
    return eliminado;
  }
}

module.exports = new PolizasService();