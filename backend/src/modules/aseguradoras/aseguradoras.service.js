const aseguradorasRepository = require('./aseguradoras.repository');

class AseguradorasService {
  async listar() {
    return aseguradorasRepository.findAll();
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

  async crear(data) {
    const dbData = {
      Ase_nombre: data.nombre,
      Ase_direccion: data.direccion,
      Ase_telefono: data.telefono,
      Ase_rfc: data.rfc,
    };
    return aseguradorasRepository.create(dbData);
  }

  async actualizar(id, data) {
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
    return aseguradorasRepository.update(id, dbData);
  }

  async eliminar(id) {
    await this.obtener(id);
    return aseguradorasRepository.delete(id);
  }
}

module.exports = new AseguradorasService();