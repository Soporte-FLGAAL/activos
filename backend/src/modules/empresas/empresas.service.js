const empresasRepository = require('./empresas.repository');
const { withTransaction } = require('../../utils/transaction');
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
    const dbData = {
      Emp_nombre: data.nombre,
      Emp_nombre_corto: data.nombreCorto || null,
      Emp_direccion: data.direccion || null,
      Emp_rfc: data.rfc,
    };

    return withTransaction(async (connection) => {
      // Validar RFC único dentro de la transacción
      const [existentes] = await connection.query(
        'SELECT 1 FROM Empresas WHERE Emp_rfc = ? LIMIT 1',
        [data.rfc]
      );
      if (existentes.length > 0) {
        const error = new Error('El RFC ya está registrado');
        error.status = 409;
        throw error;
      }

      const [result] = await connection.query('INSERT INTO Empresas SET ?', dbData);
      const nuevoId = result.insertId;

      await registrarMovimiento('Empresas', nuevoId, 'INSERT', dbData, usuarioId, connection);

      return nuevoId;
    }).then((id) => this.obtener(id));
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

    if (Object.keys(dbData).length === 0) {
      const error = new Error('No hay campos para actualizar');
      error.status = 400;
      throw error;
    }

    return withTransaction(async (connection) => {
      // Si se cambia el RFC, verificar que no exista en otra empresa
      if (dbData.Emp_rfc) {
        const [existentes] = await connection.query(
          'SELECT 1 FROM Empresas WHERE Emp_rfc = ? AND Emp_id <> ? LIMIT 1',
          [dbData.Emp_rfc, id]
        );
        if (existentes.length > 0) {
          const error = new Error('El RFC ya está registrado en otra empresa');
          error.status = 409;
          throw error;
        }
      }

      const [result] = await connection.query(
        'UPDATE Empresas SET ? WHERE Emp_id = ?',
        [dbData, id]
      );
      if (result.affectedRows === 0) {
        const error = new Error('No se pudo actualizar la empresa');
        error.status = 500;
        throw error;
      }

      await registrarMovimiento('Empresas', id, 'UPDATE', dbData, usuarioId, connection);

      return true;
    }).then(() => this.obtener(id));
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);

    return withTransaction(async (connection) => {
      const [result] = await connection.query('DELETE FROM Empresas WHERE Emp_id = ?', [id]);
      if (result.affectedRows === 0) {
        const error = new Error('No se pudo eliminar la empresa');
        error.status = 500;
        throw error;
      }

      await registrarMovimiento('Empresas', id, 'DELETE', {}, usuarioId, connection);

      return true;
    });
  }
}

module.exports = new EmpresasService();