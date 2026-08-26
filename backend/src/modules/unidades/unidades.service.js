const unidadesRepository = require('./unidades.repository');

class UnidadesService {
  async listar(filters = {}) {
    return unidadesRepository.findAll(filters);
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

  async crear(data) {
    const dbData = this._toDbData(data);
    return unidadesRepository.create(dbData);
  }

  async actualizar(id, data) {
    await this.obtener(id);
    const dbData = this._toDbData(data, true);
    return unidadesRepository.update(id, dbData);
  }

  async actualizarCampo(id, { campo, valor }) {
    await this.obtener(id);
    // Validar que el campo sea permitido y el valor adecuado según el campo
    if (campo === 'Uni_status') {
      if (!['ALTA', 'BAJA'].includes(valor)) {
        const error = new Error('Valor de status inválido');
        error.status = 422;
        throw error;
      }
    }
    const ok = await unidadesRepository.updateCampo(id, campo, valor);
    if (!ok) {
      const error = new Error('No se pudo actualizar el campo');
      error.status = 500;
      throw error;
    }
    return this.obtener(id);
  }

  async eliminar(id) {
    await this.obtener(id);
    return unidadesRepository.delete(id);
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