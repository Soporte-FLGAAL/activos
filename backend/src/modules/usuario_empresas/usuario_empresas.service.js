const usuarioEmpresasRepository = require('./usuario_empresas.repository');
const usuariosRepository = require('../usuarios/usuarios.repository');
const empresasRepository = require('../empresas/empresas.repository');
const rolesRepository = require('../roles/roles.repository');
const { registrarMovimiento } = require('../../utils/audit');

class UsuarioEmpresasService {
  async listarPorUsuario(usuarioId) {
    return usuarioEmpresasRepository.findAllByUsuario(usuarioId);
  }

  async listarPorEmpresa(empresaId) {
    return usuarioEmpresasRepository.findAllByEmpresa(empresaId);
  }

  async asignar(data) {
    // Validar existencia de usuario, empresa y rol
    const usuario = await usuariosRepository.findById(data.usuarioId);
    if (!usuario) throw { status: 404, message: 'Usuario no encontrado' };
    const empresa = await empresasRepository.findById(data.empresaId);
    if (!empresa) throw { status: 404, message: 'Empresa no encontrada' };
    const rol = await rolesRepository.findById(data.rolId);
    if (!rol) throw { status: 404, message: 'Rol no encontrado' };

    const yaExiste = await usuarioEmpresasRepository.findByUsuarioAndEmpresa(data.usuarioId, data.empresaId);
    if (yaExiste) throw { status: 409, message: 'El usuario ya tiene asignada esta empresa' };

    const dbData = {
      UE_usuario: data.usuarioId,
      UE_empresa: data.empresaId,
      UE_rol: data.rolId,
    };
    return usuarioEmpresasRepository.asignar(dbData);
  }

  async actualizarRol(usuarioId, empresaId, rolId) {
    const asignacion = await usuarioEmpresasRepository.findByUsuarioAndEmpresa(usuarioId, empresaId);
    if (!asignacion) throw { status: 404, message: 'Asignación no encontrada' };
    const rol = await rolesRepository.findById(rolId);
    if (!rol) throw { status: 404, message: 'Rol no encontrado' };
    return usuarioEmpresasRepository.actualizarRol(usuarioId, empresaId, rolId);
  }

  async eliminar(usuarioId, empresaId) {
    const asignacion = await usuarioEmpresasRepository.findByUsuarioAndEmpresa(usuarioId, empresaId);
    if (!asignacion) throw { status: 404, message: 'Asignación no encontrada' };
    await usuarioEmpresasRepository.eliminar(usuarioId, empresaId);
    return true;
  }
}

module.exports = new UsuarioEmpresasService();