const usuarioEmpresasRepository = require('./usuario_empresas.repository');
const { withTransaction } = require('../../utils/transaction');
const { registrarMovimiento } = require('../../utils/audit');
const { existeRegistro } = require('../../utils/validators');

class UsuarioEmpresasService {
  async listar(filters) {
    return usuarioEmpresasRepository.findAll(filters);
  }

  async contar(filters) {
    return usuarioEmpresasRepository.count(filters);
  }

  async asignar(data, usuarioId) {
    // Validar existencia de usuario, empresa y rol
    if (!(await existeRegistro('Usuario', 'Usu_id', data.usuarioId))) {
      const error = new Error('El usuario no existe');
      error.status = 422;
      throw error;
    }
    if (!(await existeRegistro('Empresas', 'Emp_id', data.empresaId))) {
      const error = new Error('La empresa no existe');
      error.status = 422;
      throw error;
    }
    if (!(await existeRegistro('Roles', 'Rol_id', data.rolId))) {
      const error = new Error('El rol no existe');
      error.status = 422;
      throw error;
    }

    // Verificar que no exista ya la asignación
    const existente = await usuarioEmpresasRepository.findOne(data.usuarioId, data.empresaId);
    if (existente) {
      const error = new Error('El usuario ya está asignado a esta empresa');
      error.status = 409;
      throw error;
    }

    return withTransaction(async (connection) => {
      await usuarioEmpresasRepository.create(data, connection);
      await registrarMovimiento(
        'Usuario_Empresas',
        `${data.usuarioId}-${data.empresaId}`,
        'INSERT',
        { usuarioId: data.usuarioId, empresaId: data.empresaId, rolId: data.rolId },
        usuarioId,
        connection
      );
      return true;
    });
  }

  async actualizarRol(data, usuarioId) {
    const existente = await usuarioEmpresasRepository.findOne(data.usuarioId, data.empresaId);
    if (!existente) {
      const error = new Error('La asignación no existe');
      error.status = 404;
      throw error;
    }
    if (!(await existeRegistro('Roles', 'Rol_id', data.rolId))) {
      const error = new Error('El rol no existe');
      error.status = 422;
      throw error;
    }

    return withTransaction(async (connection) => {
      await usuarioEmpresasRepository.updateRol(data.usuarioId, data.empresaId, data.rolId, connection);
      await registrarMovimiento(
        'Usuario_Empresas',
        `${data.usuarioId}-${data.empresaId}`,
        'UPDATE',
        { rolId: data.rolId },
        usuarioId,
        connection
      );
      return true;
    });
  }

  async eliminar(usuarioId, empresaId, usuarioAuditorId) {
    const existente = await usuarioEmpresasRepository.findOne(usuarioId, empresaId);
    if (!existente) {
      const error = new Error('La asignación no existe');
      error.status = 404;
      throw error;
    }

    return withTransaction(async (connection) => {
      await usuarioEmpresasRepository.delete(usuarioId, empresaId, connection);
      await registrarMovimiento(
        'Usuario_Empresas',
        `${usuarioId}-${empresaId}`,
        'DELETE',
        {},
        usuarioAuditorId,
        connection
      );
      return true;
    });
  }
}

module.exports = new UsuarioEmpresasService();