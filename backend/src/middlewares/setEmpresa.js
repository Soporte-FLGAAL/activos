const db = require('../config/database');
const { error } = require('../utils/response');

module.exports = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Verificar si el usuario es ADMIN global (rol ADMIN en cualquier empresa)
    const [adminRows] = await db.query(
      `SELECT 1
       FROM Usuario_Empresas ue
       JOIN Roles r ON ue.UE_rol = r.Rol_id
       WHERE ue.UE_usuario = ? AND r.Rol_nombre = 'ADMIN_GLOBAL'
       LIMIT 1`,
      [userId]
    );
    const esAdminGlobal = adminRows.length > 0;

    // Obtener todas las empresas del usuario
    const [empresas] = await db.query(
      'SELECT UE_empresa FROM Usuario_Empresas WHERE UE_usuario = ?',
      [userId]
    );

    // Empresa solicitada desde header, query, body o params
    const empresaSolicitada =
      req.headers['x-empresa-id'] ||
      req.query.empresaId ||
      req.body?.empresaId ||
      req.params?.empresaId ||
      null;

    // Caso: no tiene ninguna empresa asignada
    if (empresas.length === 0) {
      if (esAdminGlobal) {
        // Admin sin empresas asignadas: puede operar sin contexto
        req.empresaId = null;
        return next();
      }
      return error(res, 'El usuario no tiene empresas asignadas', 403);
    }

    // Caso: tiene una sola empresa → se asigna automáticamente
    if (empresas.length === 1) {
      // Si envían una empresa distinta a la asignada, verificar si es admin
      if (empresaSolicitada && empresaSolicitada != empresas[0].UE_empresa) {
        if (!esAdminGlobal) {
          return error(res, 'No tiene acceso a la empresa especificada', 403);
        }
        // Admin puede operar con otra empresa, se respeta la solicitada
        req.empresaId = empresaSolicitada;
        return next();
      }
      req.empresaId = empresas[0].UE_empresa;
      return next();
    }

    // Caso: múltiples empresas
    if (!empresaSolicitada) {
      if (esAdminGlobal) {
        // Admin puede operar sin contexto específico
        req.empresaId = null;
        return next();
      }
      // Usuario normal con múltiples empresas debe especificar una
      return error(
        res,
        'Debe especificar la empresa mediante header X-Empresa-Id o parámetro empresaId',
        400
      );
    }

    // Verificar que la empresa solicitada pertenezca al usuario (o sea admin)
    const pertenece = empresas.some(e => e.UE_empresa == empresaSolicitada);
    if (!pertenece && !esAdminGlobal) {
      return error(res, 'No tiene acceso a la empresa especificada', 403);
    }

    req.empresaId = Number(empresaSolicitada);
    next();
  } catch (err) {
    next(err);
  }
};