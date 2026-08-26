const empresasRepository = require('./empresas.repository');

class EmpresasService {
  async listar() {
    return empresasRepository.findAll();
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

  async crear(data) {
    const dbData = {
      Emp_nombre: data.nombre,
      Emp_nombre_corto: data.nombreCorto || null,
      Emp_direccion: data.direccion || null,
      Emp_rfc: data.rfc,
    };
    return empresasRepository.create(dbData);
  }

  async actualizar(id, data) {
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
    return empresasRepository.update(id, dbData);
  }

  async eliminar(id) {
    await this.obtener(id);
    return empresasRepository.delete(id);
  }
}

module.exports = new EmpresasService();