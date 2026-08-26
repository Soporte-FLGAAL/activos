const usuariosRepository = require('./usuarios.repository');
const { comparePassword } = require('../../utils/password');

class UsuariosService {
  async listar() {
    return usuariosRepository.findAll();
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

  async crear(data) {
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
    return usuariosRepository.create(usuarioData);
  }

  async actualizar(id, data) {
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
    return usuariosRepository.update(id, dbData);
  }

  async cambiarPasswordPropio(id, { passwordActual, nuevaPassword }) {
    const usuarioCompleto = await usuariosRepository.findByEmail((await this.obtener(id)).Usu_correo);
    const valida = await comparePassword(passwordActual, usuarioCompleto.Usu_password);
    if (!valida) {
      const error = new Error('La contraseña actual es incorrecta');
      error.status = 401;
      throw error;
    }
    await usuariosRepository.updatePassword(id, nuevaPassword);
  }

  async adminCambiarPassword(id, { nuevaPassword }) {
    await this.obtener(id);
    await usuariosRepository.updatePassword(id, nuevaPassword);
  }

  async eliminar(id) {
    await this.obtener(id);
    return usuariosRepository.delete(id);
  }
}

module.exports = new UsuariosService();