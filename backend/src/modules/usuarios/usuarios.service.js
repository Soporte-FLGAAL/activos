const usuariosRepository = require('./usuarios.repository');
const { comparePassword } = require('../../utils/password');
const { registrarMovimiento } = require('../../utils/audit');
const { withTransaction } = require('../../utils/transaction');

class UsuariosService {
  async listar(filters) {
    return usuariosRepository.findAll(filters);
  }

  async contar(filters) {
    return usuariosRepository.count(filters);
  }

  async obtener(id, empresaId = null) {
    const usuario = await usuariosRepository.findById(id, empresaId);
    if (!usuario) {
      const error = new Error('Usuario no encontrado');
      error.status = 404;
      throw error;
    }
    return usuario;
  }

  async crear(data, usuarioId) {
    const existe = await usuariosRepository.findByEmail(data.correo);
    if (existe) {
      const error = new Error('El correo ya está registrado');
      error.status = 409;
      throw error;
    }
    const usuarioData = {
      Usu_nombres: data.nombres,
      Usu_ap_paterno: data.apPaterno,
      Usu_ap_materno: data.apMaterno || null,
      Usu_telefono: data.telefono || null,
      Usu_correo: data.correo,
      Usu_password: data.password,
    };

    return withTransaction(async (connection) => {
      const nuevoId = await usuariosRepository.create(usuarioData, connection);
      await registrarMovimiento('Usuario', nuevoId, 'INSERT', { correo: data.correo }, usuarioId, connection);
      return nuevoId;
    }).then((id) => this.obtener(id));
  }

  async actualizar(id, data, usuarioId, empresaId = null) {
    await this.obtener(id, empresaId);
    const map = {
      nombres: 'Usu_nombres',
      apPaterno: 'Usu_ap_paterno',
      apMaterno: 'Usu_ap_materno',
      telefono: 'Usu_telefono',
      correo: 'Usu_correo',
      status: 'Usu_status',
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
      const ok = await usuariosRepository.update(id, dbData, empresaId, connection);
      if (!ok) {
        const error = new Error('No se pudo actualizar el usuario');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Usuario', id, 'UPDATE', dbData, usuarioId, connection);
      return true;
    }).then(() => this.obtener(id, empresaId));
  }

  async cambiarPasswordPropio(id, { passwordActual, nuevaPassword }, usuarioId) {
    const usuarioCompleto = await usuariosRepository.findByEmail((await this.obtener(id)).Usu_correo);
    const valida = await comparePassword(passwordActual, usuarioCompleto.Usu_password);
    if (!valida) {
      const error = new Error('La contraseña actual es incorrecta');
      error.status = 401;
      throw error;
    }

    return withTransaction(async (connection) => {
      await usuariosRepository.updatePassword(id, nuevaPassword, null, connection);
      await registrarMovimiento('Usuario', id, 'UPDATE', { cambio: 'password' }, usuarioId, connection);
      return true;
    });
  }

  async adminCambiarPassword(id, { nuevaPassword }, usuarioId, empresaId = null) {
    // Solo puede cambiar la contraseña de un usuario de su empresa
    await this.obtener(id, empresaId);

    return withTransaction(async (connection) => {
      const ok = await usuariosRepository.updatePassword(id, nuevaPassword, empresaId, connection);
      if (!ok) {
        const error = new Error('No se pudo actualizar la contraseña');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Usuario', id, 'UPDATE', { cambio: 'password_admin' }, usuarioId, connection);
      return true;
    });
  }

  async reactivar(id, usuarioId, empresaId = null) {
    await this.obtener(id, empresaId); // valida existencia + pertenencia

    return withTransaction(async (connection) => {
      const ok = await usuariosRepository.reactivar(id, empresaId, connection);
      if (!ok) {
        const error = new Error('No se pudo reactivar el usuario');
        error.status = 500;
        throw error;
      }

      await registrarMovimiento('Usuario', id, 'UPDATE', { campo: 'Usu_status', valor: 'ACTIVO' }, usuarioId,connection);

      return true;
    }).then(() => this.obtener(id, empresaId));
  }

  /**
   * Desactivar usuario (soft delete). Es el flujo normal.
   */
  async desactivar(id, usuarioId, empresaId = null) {
    await this.obtener(id, empresaId); // valida existencia + pertenencia

    return withTransaction(async (connection) => {
      const ok = await usuariosRepository.softDelete(id, empresaId, connection);
      if (!ok) {
        const error = new Error('No se pudo desactivar el usuario');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Usuario',id, 'UPDATE',{ campo: 'Usu_status', valor: 'INACTIVO' },usuarioId,connection);
      return true;
    }).then(() => this.obtener(id, empresaId));
  }

  /**
   * Eliminar físicamente un usuario.
   * Solo debe invocarse desde un flujo protegido (ADMIN_GLOBAL).
   * Elimina primero las asignaciones para respetar la FK.
   */
  async eliminarDefinitivo(id, usuarioId) {
    // Sin filtro de empresa: solo ADMIN_GLOBAL llega aquí
    const usuario = await usuariosRepository.findById(id);
    if (!usuario) {
      const error = new Error('Usuario no encontrado');
      error.status = 404;
      throw error;
    }

    return withTransaction(async (connection) => {
      const ok = await usuariosRepository.hardDelete(id, connection);
      if (!ok) {
        const error = new Error('No se pudo eliminar el usuario');
        error.status = 500;
        throw error;
      }
      await registrarMovimiento('Usuario', id, 'DELETE', { correo: usuario.Usu_correo }, usuarioId, connection);
      return true;
    });
  }
}

module.exports = new UsuariosService();