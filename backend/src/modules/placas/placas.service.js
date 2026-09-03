const placasRepository = require('./placas.repository');
const { registrarMovimiento } = require('../../utils/audit');

class PlacasService {
  async listar(filters) {
    return placasRepository.findAll(filters);
  }

  async contar(filters) {
    return placasRepository.count(filters);
  }
  
  async obtener(id) {
    const placa = await placasRepository.findById(id);
    if (!placa) {
      const error = new Error('Placa no encontrada');
      error.status = 404;
      throw error;
    }
    return placa;
  }

  async crear(data, usuarioId) {
    if (data.propietarioId && !(await existeRegistro('Empresas', 'Emp_id', data.propietarioId))) {
      const error = new Error('El propietario no existe');
      error.status = 422;
      throw error;
    }
    if (!(await existeRegistro('Empresas', 'Emp_id', data.empresaActualId))) {
      const error = new Error('La empresa actual no existe');
      error.status = 422;
      throw error;
    }

    const dbData = {
      Pla_placas: data.placas,
      Pla_status: data.status,
      Pla_propietario: data.propietarioId || null,
      Pla_empresa_actual: data.empresaActualId,
    };
    const nueva = await placasRepository.create(dbData);
    await registrarMovimiento('Placas', nueva.Pla_id, 'INSERT', dbData, usuarioId);
    return nueva;
  }

  async actualizarPlacaConMovimiento(idPlaca, dataPlaca, dataMovimiento, usuarioId) {
    await this.obtener(idPlaca); // verifica existencia
    // Validar FK del movimiento
    if (!(await existeRegistro('Tipo_movimiento_placa', 'TpMP_id', dataMovimiento.tipoMovimientoId))) {
      const error = new Error('El tipo de movimiento no existe');
      error.status = 422;
      throw error;
    }

    return withTransaction(async (connection) => {
      // Actualizar placa
      const campos = [];
      const valores = [];
      if (dataPlaca.placas !== undefined) { campos.push('Pla_placas = ?'); valores.push(dataPlaca.placas); }
      if (dataPlaca.status !== undefined) { campos.push('Pla_status = ?'); valores.push(dataPlaca.status); }
      if (dataPlaca.propietarioId !== undefined) { campos.push('Pla_propietario = ?'); valores.push(dataPlaca.propietarioId); }
      if (dataPlaca.empresaActualId !== undefined) { campos.push('Pla_empresa_actual = ?'); valores.push(dataPlaca.empresaActualId); }

      if (campos.length > 0) {
        valores.push(idPlaca);
        await connection.query(
          `UPDATE Placas SET ${campos.join(', ')} WHERE Pla_id = ?`,
          valores
        );
      }

      // Insertar detalle de movimiento
      await connection.query(
        `INSERT INTO Detalle_placas (DP_placas_id, DP_tipo_movimiento, DP_costo, DP_fecha, DP_url)
         VALUES (?,?,?,?,?)`,
        [
          idPlaca,
          dataMovimiento.tipoMovimientoId,
          dataMovimiento.costo,
          dataMovimiento.fecha,
          dataMovimiento.url,
        ]
      );

      // Auditoría
      await registrarMovimiento('Placas', idPlaca, 'UPDATE', { dataPlaca, dataMovimiento }, usuarioId, connection);

      return true;
    });
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);
    if (data.propietarioId && !(await existeRegistro('Empresas', 'Emp_id', data.propietarioId))) {
      const error = new Error('El propietario no existe');
      error.status = 422;
      throw error;
    }
    if (!(await existeRegistro('Empresas', 'Emp_id', data.empresaActualId))) {
      const error = new Error('La empresa actual no existe');
      error.status = 422;
      throw error;
    }
    
    const map = {
      placas: 'Pla_placas',
      status: 'Pla_status',
      propietarioId: 'Pla_propietario',
      empresaActualId: 'Pla_empresa_actual',
    };
    const dbData = {};
    for (const key in data) {
      if (map[key]) dbData[map[key]] = data[key];
    }
    const actualizada = await placasRepository.update(id, dbData);
    await registrarMovimiento('Placas', id, 'UPDATE', dbData, usuarioId);
    return actualizada;
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);
    const eliminado = await placasRepository.delete(id);
    if (eliminado) {
      await registrarMovimiento('Placas', id, 'DELETE', {}, usuarioId);
    }
    return eliminado;
  }
}

module.exports = new PlacasService();