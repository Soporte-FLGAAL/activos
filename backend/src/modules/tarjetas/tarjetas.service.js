const tarjetasRepository = require('./tarjetas.repository');
const { registrarMovimiento } = require('../../utils/audit');

class TarjetasService {
  async listar(filters) {
    return tarjetasRepository.findAll(filters);
  }

  async contar(filters) {
    return tarjetasRepository.count(filters);
  }

  async obtener(id) {
    const tarjeta = await tarjetasRepository.findById(id);
    if (!tarjeta) {
      const error = new Error('Tarjeta de circulación no encontrada');
      error.status = 404;
      throw error;
    }
    return tarjeta;
  }

  async crear(data, usuarioId) {
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
    const nueva = await tarjetasRepository.create(dbData);
    await registrarMovimiento('Tarjeta_circulacion', nueva.TC_id, 'INSERT', dbData, usuarioId);
    return nueva;
  }

  async crearTarjetaConCotejos(dataTarjeta, cotejos, usuarioId) {
    // Validaciones de FK previas
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
      // Insertar tarjeta
      const [result] = await connection.query(
        `INSERT INTO Tarjeta_circulacion 
         (TC_tarjeta, TC_unidad_id, TC_costo, TC_tipo, TC_status, TC_no_original, TC_placas_id, TC_fecha_obtencion, TC_fecha_vencimiento, TC_url)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
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
          dataTarjeta.url,
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

      // Auditoría
      await connection.query(
        `INSERT INTO Movimientos (Mov_tabla_afectada, Mov_registro_afectado, Mov_accion, Mov_detalles, Mov_usu_id)
         VALUES ('Tarjeta_circulacion', ?, (SELECT AcM_id FROM Acciones_movimiento WHERE AcM_nombre = 'INSERT'), ?, ?)`,
        [tarjetaId.toString(), JSON.stringify({ ...dataTarjeta, cotejos }), usuarioId]
      );

      return tarjetaId;
    });
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);
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
      if (map[key]) dbData[map[key]] = data[key];
    }
    const actualizada = await tarjetasRepository.update(id, dbData);
    await registrarMovimiento('Tarjeta_circulacion', id, 'UPDATE', dbData, usuarioId);
    return actualizada;
  }

  async actualizarUrl(id, url) {
    await this.obtener(id);
    await tarjetasRepository.updateUrl(id, url);
    await registrarMovimiento('Tarjeta_circulacion', id, 'UPDATE', { campo: 'TC_url', valor: url }, usuarioId);
    return this.obtener(id);
  }

  async eliminar(id) {
    await this.obtener(id);
    const eliminado = await tarjetasRepository.delete(id);
    if (eliminado) {
      await registrarMovimiento('Tarjeta_circulacion', id, 'DELETE', {}, usuarioId);
    }
    return eliminado;
  }
}

module.exports = new TarjetasService();