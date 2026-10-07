const usuarioEmpresasRepository = require('./usuario_empresas.repository');
const { withTransaction } = require('../../utils/transaction');
const { registrarMovimiento } = require('../../utils/audit');
const { existeRegistro } = require('../../utils/validators');

class UsuarioEmpresasService {
  async _getNombreRol(rolId, connection = null) {
    const dbConn = connection || require('../../config/database');
    const [rows] = await dbConn.query(
      'SELECT Rol_nombre FROM Roles WHERE Rol_id = ?',
      [rolId]
    );
    return rows[0]?.Rol_nombre || null;
  }

  async listar(filters) {
    return usuarioEmpresasRepository.findAll(filters);
  }

  async contar(filters) {
    return usuarioEmpresasRepository.count(filters);
  }

  async asignar(data, auditorId, auditorEsGlobal) {
    const { usuarioId, empresaId, rolId } = data;

    if (!(await existeRegistro('Usuario', 'Usu_id', usuarioId))) {
      const error = new Error('El usuario no existe');
      error.status = 422;
      throw error;
    }
    if (!(await existeRegistro('Empresas', 'Emp_id', empresaId))) {
      const error = new Error('La empresa no existe');
      error.status = 422;
      throw error;
    }
    if (!(await existeRegistro('Roles', 'Rol_id', rolId))) {
      const error = new Error('El rol no existe');
      error.status = 422;
      throw error;
    }

    const existente = await usuarioEmpresasRepository.findOne(usuarioId, empresaId);
    if (existente) {
      const error = new Error('El usuario ya está asignado a esta empresa');
      error.status = 409;
      throw error;
    }

    const nombreRol = await this._getNombreRol(rolId);

    if (nombreRol === ROL_ADMIN_GLOBAL && !auditorEsGlobal) {
      const error = new Error('Solo un administrador global puede asignar el rol ADMIN_GLOBAL');
      error.status = 403;
      throw error;
    }

    return withTransaction(async (connection) => {
      await usuarioEmpresasRepository.create({ usuarioId, empresaId, rolId }, connection);
      await registrarMovimiento(
        'Usuario_Empresas',
        `${usuarioId}-${empresaId}`,
        'INSERT',
        { usuarioId, empresaId, rolId, rolNombre: nombreRol },
        auditorId,
        connection
      );
      return true;
    });
  }

  async actualizarRol(data, auditorId, auditorEsGlobal) {
    const { usuarioId, empresaId, rolId } = data;

    const existente = await usuarioEmpresasRepository.findOne(usuarioId, empresaId);
    if (!existente) {
      const error = new Error('La asignación no existe');
      error.status = 404;
      throw error;
    }
    if (!(await existeRegistro('Roles', 'Rol_id', rolId))) {
      const error = new Error('El rol no existe');
      error.status = 422;
      throw error;
    }

    const rolActualNombre = await this._getNombreRol(existente.UE_rol);
    const rolNuevoNombre = await this._getNombreRol(rolId);

    const afectaAdminGlobal =
      rolActualNombre === ROL_ADMIN_GLOBAL ||
      rolNuevoNombre === ROL_ADMIN_GLOBAL;

    if (afectaAdminGlobal && !auditorEsGlobal) {
      const error = new Error(
        'Solo un administrador global puede modificar asignaciones con rol ADMIN_GLOBAL'
      );
      error.status = 403;
      throw error;
    }

    return withTransaction(async (connection) => {
      await usuarioEmpresasRepository.updateRol(usuarioId, empresaId, rolId, connection);
      await registrarMovimiento(
        'Usuario_Empresas',
        `${usuarioId}-${empresaId}`,
        'UPDATE',
        {
          rolAnteriorId: existente.UE_rol,
          rolAnteriorNombre: rolActualNombre,
          rolNuevoId: rolId,
          rolNuevoNombre,
        },
        auditorId,
        connection
      );
      return true;
    });
  }

  async eliminar(usuarioId, empresaId, auditorId, auditorEsGlobal) {
    const existente = await usuarioEmpresasRepository.findOne(usuarioId, empresaId);
    if (!existente) {
      const error = new Error('La asignación no existe');
      error.status = 404;
      throw error;
    }

    const rolActualNombre = await this._getNombreRol(existente.UE_rol);

    if (rolActualNombre === ROL_ADMIN_GLOBAL) {
      if (!auditorEsGlobal) {
        const error = new Error(
          'Solo un administrador global puede eliminar asignaciones con rol ADMIN_GLOBAL'
        );
        error.status = 403;
        throw error;
      }

      // Evitar lock-out: si el auditor se está quitando su propia última asignación global
      if (Number(usuarioId) === Number(auditorId)) {
        const total = await usuarioEmpresasRepository.countByUsuarioAndRolNombre(
          auditorId,
          ROL_ADMIN_GLOBAL
        );
        if (total <= 1) {
          const error = new Error(
            'No puede eliminar su propia asignación ADMIN_GLOBAL porque perdería el acceso'
          );
          error.status = 409;
          throw error;
        }
      }
    }

    return withTransaction(async (connection) => {
      await usuarioEmpresasRepository.delete(usuarioId, empresaId, connection);
      await registrarMovimiento(
        'Usuario_Empresas',
        `${usuarioId}-${empresaId}`,
        'DELETE',
        { rolEliminadoId: existente.UE_rol, rolEliminadoNombre: rolActualNombre },
        auditorId,
        connection
      );
      return true;
    });
  }
}

module.exports = new UsuarioEmpresasService();