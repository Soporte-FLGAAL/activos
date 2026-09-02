const db = require('../config/database');
const { error } = require('../utils/response');

module.exports = (permisoRequerido) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const empresaId = req.empresaId;

      // Verificar si es admin global: tiene rol ADMIN en cualquier empresa
      const [adminRows] = await db.query(
        `SELECT 1 FROM Usuario_Empresas ue
         JOIN Roles r ON ue.UE_rol = r.Rol_id
         WHERE ue.UE_usuario = ? AND r.Rol_nombre = 'ADMIN'
         LIMIT 1`,
        [userId]
      );
      if (adminRows.length > 0) {
        return next(); // Admin global tiene acceso total
      }

      // Si no hay empresaId, denegar (a menos que sea admin, ya cubierto)
      if (!empresaId) {
        return error(res, 'No se pudo determinar la empresa', 400);
      }

      // Consultar permisos del usuario en la empresa específica
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
    } catch (err) {
      return error(res, 'Error de autorización', 500);
    }
  };
};