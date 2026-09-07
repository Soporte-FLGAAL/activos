const empresasRepository = require('./empresas.repository');
const { registrarMovimiento } = require('../../utils/audit');

class EmpresasService {
  async listar(filters) {
    return empresasRepository.findAll(filters);
  }

  async contar(filters) {
    return empresasRepository.count(filters);
  }

  async obtener(id) {
    const empresa = await empresasRepository.findById(id);
    if (!empresa) {
      const error = new Error('Empresa no encontrada');
      error.status = 404;
      throw error;
    }
    return empresa;
  }

  async crear(data, usuarioId) {
    const [existentes] = await db.query('SELECT 1 FROM Empresas WHERE Emp_rfc = ?', [data.rfc]);
    if (existentes.length > 0) {
      const error = new Error('El RFC ya está registrado');
      error.status = 409;
      throw error;
    }
    const dbData = {
      Emp_nombre: data.nombre,
      Emp_nombre_corto: data.nombreCorto || null,
      Emp_direccion: data.direccion || null,
      Emp_rfc: data.rfc,
    };
    const nuevaEmpresa = await empresasRepository.create(dbData);
    await registrarMovimiento('Empresas', nuevaEmpresa.Emp_id, 'INSERT', dbData, usuarioId);
    return nuevaEmpresa;

  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);
    const map = {
      nombre: 'Emp_nombre',
      nombreCorto: 'Emp_nombre_corto',
      direccion: 'Emp_direccion',
      rfc: 'Emp_rfc',
    };
    const dbData = {};
    for (const key in data) {
      if (map[key]) dbData[map[key]] = data[key];
    }
    const empresaActualizada = await empresasRepository.update(id, dbData);
    await registrarMovimiento('Empresas', id, 'UPDATE', dbData, usuarioId);
    return empresaActualizada;
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);
    const eliminado = await empresasRepository.delete(id);
    if (eliminado) {
      await registrarMovimiento('Empresas', id, 'DELETE', {}, usuarioId);
    }
    return eliminado;
  }
}

module.exports = new EmpresasService();