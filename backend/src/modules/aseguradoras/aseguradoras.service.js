const aseguradorasRepository = require('./aseguradoras.repository');
const { registrarMovimiento } = require('../../utils/audit');
const { withTransaction } = require('../../utils/transaction');

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

    return withTransaction(async (connection) => {
      const nuevaId = await aseguradorasRepository.create(dbData, connection);
      await registrarMovimiento('Aseguradoras', nuevaId, 'INSERT', dbData, usuarioId, connection);
      return nuevaId;
    }).then((id) => this.obtener(id));
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
    for (const key in data) if (map[key]) dbData[map[key]] = data[key];

    if (Object.keys(dbData).length === 0) {
      const error = new Error('No hay campos para actualizar');
      error.status = 400;
      throw error;
    }

    return withTransaction(async (connection) => {
      const ok = await aseguradorasRepository.update(id, dbData, connection);
      if (!ok) {
        const error = new Error('No se pudo actualizar la aseguradora');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Aseguradoras', id, 'UPDATE', dbData, usuarioId, connection);
      return true;
    }).then(() => this.obtener(id));
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);

    return withTransaction(async (connection) => {
      const ok = await aseguradorasRepository.delete(id, connection);
      if (!ok) {
        const error = new Error('No se pudo eliminar la aseguradora');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Aseguradoras', id, 'DELETE', {}, usuarioId, connection);
      return true;
    });
  }
}

module.exports = new AseguradorasService();