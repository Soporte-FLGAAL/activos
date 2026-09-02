const responsablesAseguradorasRepository = require('./responsables_aseguradoras.repository');
const { registrarMovimiento } = require('../../utils/audit');
const { existeRegistro } = require('../../utils/validators');

class ResponsablesAseguradorasService {
  async listar(filters) {
    return responsablesAseguradorasRepository.findAll(filters);
  }

  async contar(filters) {
    return responsablesAseguradorasRepository.count(filters);
  }

  async obtener(id) {
    const responsable = await responsablesAseguradorasRepository.findById(id);
    if (!responsable) {
      const error = new Error('Responsable de aseguradora no encontrado');
      error.status = 404;
      throw error;
    }
    return responsable;
  }

  async crear(data) {
    if (!(await existeRegistro('Aseguradoras', 'Ase_id', data.aseguradoraId))) {
      const error = new Error('La aseguradora no existe');
      error.status = 422;
      throw error;
    }
    if (data.empresaResponsableId && !(await existeRegistro('Empresas', 'Emp_id', data.empresaResponsableId))) {
      const error = new Error('La empresa responsable no existe');
      error.status = 422;
      throw error;
    }

    const dbData = {
      RA_aseguradora: data.aseguradoraId,
      RA_responsable: data.responsable,
      RA_puesto_responsable: data.puestoResponsable || null,
      RA_telefono: data.telefono,
      RA_empresa_responsable: data.empresaResponsableId || null,
    };
    const nuevo = await responsablesAseguradorasRepository.create(dbData);
    await registrarMovimiento('Responsables_Aseguradoras', nuevo.RA_id, 'INSERT', dbData, usuarioId);
    return nuevo;
  }

  async actualizar(id, data) {
    await this.obtener(id);
    const map = {
      aseguradoraId: 'RA_aseguradora',
      responsable: 'RA_responsable',
      puestoResponsable: 'RA_puesto_responsable',
      telefono: 'RA_telefono',
      empresaResponsableId: 'RA_empresa_responsable',
    };
    const dbData = {};
    for (const key in data) {
      if (map[key]) dbData[map[key]] = data[key];
    }
    const actualizado = await responsablesAseguradorasRepository.update(id, dbData);
    await registrarMovimiento('Responsables_Aseguradoras', id, 'UPDATE', dbData, usuarioId);
    return actualizado;
  }

  async eliminar(id) {
    await this.obtener(id);
    const eliminado = await responsablesAseguradorasRepository.delete(id);
    if (eliminado) {
      await registrarMovimiento('Responsables_Aseguradoras', id, 'DELETE', {}, usuarioId);
    }
    return eliminado;
  }
}

module.exports = new ResponsablesAseguradorasService();