const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const authRepository = require('./auth.repository');
const { comparePassword } = require('../../utils/password');
const { withTransaction } = require('../../utils/transaction');

class AuthService {
  _noAutorizado(mensaje = 'Refresh token inválido') {
    const error = new Error(mensaje);
    error.status = 401;
    return error;
  }

  async login(email, password) {
    const user = await authRepository.findByEmail(email);
    if (!user) throw this._noAutorizado('Credenciales inválidas');
    if (user.Usu_status !== 'ACTIVO') throw this._noAutorizado('Credenciales inválidas');

    const valid = await comparePassword(password, user.Usu_password);
    if (!valid) throw this._noAutorizado('Credenciales inválidas');

    await authRepository.updateLastAccess(user.Usu_id);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const decodedNew = verifyRefreshToken(refreshToken);
    const expiraEn = new Date(decodedNew.exp * 1000);
    await authRepository.guardarRefreshToken(user.Usu_id, refreshToken, expiraEn);

    // *** Nuevo: empresas y roles ***
    const empresasRaw = await authRepository.findEmpresasByUsuario(user.Usu_id);
    const empresas = empresasRaw.map(e => ({
      id: e.Emp_id,
      nombre: e.Emp_nombre,
      nombreCorto: e.Emp_nombre_corto,
      rolId: e.Rol_id,
      rolNombre: e.Rol_nombre,
    }));
    const esAdminGlobal = empresas.some(e => e.rolNombre === 'ADMIN_GLOBAL');

    return {
      user: {
        id: user.Usu_id,
        email: user.Usu_correo,
        nombres: `${user.Usu_nombres} ${user.Usu_ap_paterno}`,
        esAdminGlobal,
      },
      empresas,          // <-- lista de empresas + rol por empresa
      accessToken,
      refreshToken,
    };
  }

  async me(usuarioId) {
    const user = await authRepository.findById(usuarioId);
    if (!user || user.Usu_status !== 'ACTIVO') {
      const error = new Error('Usuario no encontrado o inactivo');
      error.status = 401;
      throw error;
    }

    const empresasRaw = await authRepository.findEmpresasByUsuario(usuarioId);
    const empresas = empresasRaw.map(e => ({
      id: e.Emp_id,
      nombre: e.Emp_nombre,
      nombreCorto: e.Emp_nombre_corto,
      rolId: e.Rol_id,
      rolNombre: e.Rol_nombre,
    }));
    const esAdminGlobal = empresas.some(e => e.rolNombre === 'ADMIN_GLOBAL');

    return {
      user: {
        id: user.Usu_id,
        email: user.Usu_correo,
        nombres: user.Usu_nombres,
        apPaterno: user.Usu_ap_paterno,
        esAdminGlobal,
      },
      empresas,
    };
  }

  async refreshToken(token) {
    // 1. Validar firma y expiración criptográfica
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      throw this._noAutorizado();
    }

    // 2. Verificar que el usuario exista y esté activo
    const user = await authRepository.findById(decoded.userId);
    if (!user || user.Usu_status !== 'ACTIVO') {
      throw this._noAutorizado();
    }

    // 3. Rotación atómica: bloquear → verificar → revocar → insertar
    return withTransaction(async (connection) => {
      // 3a. Bloquear la fila del token actual (dentro de la transacción)
      const locked = await authRepository.findRefreshTokenForUpdate(token, connection);
      if (!locked) {
        // No existe: fue revocado, ya consumido, o nunca existió
        throw this._noAutorizado();
      }

      // 3b. Verificar expiración en BD
      if (new Date(locked.RT_expiracion) < new Date()) {
        // Está expirado → revocarlo dentro de la misma transacción y salir
        await authRepository.revocarRefreshToken(token, connection);
        throw this._noAutorizado('Refresh token expirado');
      }

      // 3c. Revocar el token usado
      await authRepository.revocarRefreshToken(token, connection);

      // 3d. Generar nuevos tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // 3e. Obtener expiración real del nuevo token
      const decodedNew = verifyRefreshToken(refreshToken);
      const expiraEn = new Date(decodedNew.exp * 1000);

      // 3f. Persistir el nuevo refresh token con la MISMA conexión
      await authRepository.guardarRefreshToken(user.Usu_id, refreshToken, expiraEn, connection);

      return { accessToken, refreshToken };
    });
  }

  async logout(token) {
   try {
      await authRepository.revocarRefreshToken(token);
      return true;
    } catch (err) {
      const error = new Error('No se pudo cerrar sesión');
      error.status = 500;
      throw error;
    }
  }
}

module.exports = new AuthService();