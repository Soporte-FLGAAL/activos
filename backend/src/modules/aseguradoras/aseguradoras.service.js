const aseguradorasRepository = require('./aseguradoras.repository');
const { registrarMovimiento } = require('../../utils/audit');

class AseguradorasService {
  async listar(filters) {
    return aseguradorasRepository.findAll(filters);
  }

  async contar(filters) {
    return aseguradorasRepository.count(filters);
  }

  async obtener(id) {
    const aseguradora = await aseguradorasRepository.findById(id);
    if (!aseguradora) {
      const error = new Error('Aseguradora no encontrada');
      error.status = 404;
      throw error;
    }
    return aseguradora;
  }

  async crear(data, usuarioId) {
    const dbData = {
      Ase_nombre: data.nombre,
      Ase_direccion: data.direccion,
      Ase_telefono: data.telefono,
      Ase_rfc: data.rfc,
    };
    const nueva = await aseguradorasRepository.create(dbData);
    await registrarMovimiento('Aseguradoras', nueva.Ase_id, 'INSERT', dbData, usuarioId);
    return nueva;
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);
    const map = {
      nombre: 'Ase_nombre',
      direccion: 'Ase_direccion',
      telefono: 'Ase_telefono',
      rfc: 'Ase_rfc',
    };
    const dbData = {};
    for (const key in data) {
      if (map[key]) dbData[map[key]] = data[key];
    }
    const actualizada = await aseguradorasRepository.update(id, dbData);
    await registrarMovimiento('Aseguradoras', id, 'UPDATE', dbData, usuarioId);
    return actualizada;
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);
    const eliminado = await aseguradorasRepository.delete(id);
    if (eliminado) {
      await registrarMovimiento('Aseguradoras', id, 'DELETE', {}, usuarioId);
    }
    return eliminado;
  }
}

module.exports = new AseguradorasService();