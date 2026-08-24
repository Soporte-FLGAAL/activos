const db = require('../config/database');
const { error } = require('../utils/response');

module.exports = (permisoRequerido) => {
  return async (req, res, next) => {
    const userId = req.user.userId;
    const empresaId = req.body.empresaId || req.params.empresaId || req.query.empresaId;

    if (!empresaId) {
      const [rows] = await db.query(
        `SELECT 1 FROM Usuario_Empresas ue 
         JOIN Roles r ON ue.UE_rol = r.Rol_id 
         WHERE ue.UE_usuario = ? AND r.Rol_nombre = 'ADMIN'`,
        [userId]
      );
      if (rows.length > 0) return next();
      return error(res, 'Acceso denegado', 403);
    }

    const [permisos] = await db.query(
      `SELECT p.PerM_nombre 
       FROM Usuario_Empresas ue
       JOIN Rol_Permisos rp ON ue.UE_rol = rp.RP_rol
       JOIN Permisos p ON rp.RP_permiso = p.PerM_id
       WHERE ue.UE_usuario = ? AND ue.UE_empresa = ?`,
      [userId, empresaId]
    );

    const permisoEncontrado = permisos.some(p => p.PerM_nombre === permisoRequerido);
    if (!permisoEncontrado) {
      return error(res, 'No tiene permisos para esta acción', 403);
    }
    next();
  };
};