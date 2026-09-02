const usuariosRepository = require('./usuarios.repository');
const { comparePassword } = require('../../utils/password');
const { registrarMovimiento } = require('../../utils/audit');

class UsuariosService {
  async listar(filters) {
    return usuariosRepository.findAll(filters);
  }

  async contar(filters) {
    return usuariosRepository.count(filters);
  }

  async obtener(id) {
    const usuario = await usuariosRepository.findById(id);
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
    const nuevoUsuario = await usuariosRepository.create(usuarioData);
    await registrarMovimiento('Usuario', nuevoUsuario.Usu_id, 'INSERT', { correo: nuevoUsuario.Usu_correo }, usuarioId);
    return nuevoUsuario;
  }

  async actualizar(id, data, usuarioId) {
    await this.obtener(id);
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
    const usuarioActualizado = await usuariosRepository.update(id, dbData);
    await registrarMovimiento('Usuario', id, 'UPDATE', dbData, usuarioId);
    return usuarioActualizado;
  }

  async cambiarPasswordPropio(id, { passwordActual, nuevaPassword }, usuarioId) {
    const usuarioCompleto = await usuariosRepository.findByEmail((await this.obtener(id)).Usu_correo);
    const valida = await comparePassword(passwordActual, usuarioCompleto.Usu_password);
    if (!valida) {
      const error = new Error('La contraseña actual es incorrecta');
      error.status = 401;
      throw error;
    }
    await usuariosRepository.updatePassword(id, nuevaPassword);
    await registrarMovimiento('Usuario', id, 'UPDATE', { cambio: 'password' }, usuarioId);
  }

  async adminCambiarPassword(id, { nuevaPassword }, usuarioId) {
    await this.obtener(id);
    await usuariosRepository.updatePassword(id, nuevaPassword);
    await registrarMovimiento('Usuario', id, 'UPDATE', { cambio: 'password_admin' }, usuarioId);
  }

  async eliminar(id, usuarioId) {
    await this.obtener(id);
    const eliminado = await usuariosRepository.delete(id);
    if (eliminado) {
      await registrarMovimiento('Usuario', id, 'DELETE', {}, usuarioId);
    }
    return eliminado;
  }
}

module.exports = new UsuariosService();