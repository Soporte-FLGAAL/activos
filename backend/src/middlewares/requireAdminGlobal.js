const db = require('../config/database');
const { error } = require('../utils/response');

module.exports = async (req, res, next) => {
  try {
    // setEmpresa puede haber determinado previamente este dato.
    if (req.esAdminGlobal === true) return next();
    if (req.esAdminGlobal === false) {
      return error(res, 'Acceso restringido a ADMIN_GLOBAL', 403);
    }

    const [rows] = await db.query(
      `SELECT 1
       FROM Usuario_Empresas ue
       JOIN Roles r ON ue.UE_rol = r.Rol_id
       WHERE ue.UE_usuario = ? AND r.Rol_nombre = 'ADMIN_GLOBAL'
       LIMIT 1`,
      [req.user.userId]
    );

    if (rows.length === 0) {
      return error(res, 'Acceso restringido a ADMIN_GLOBAL', 403);
    }

    req.esAdminGlobal = true;
    return next();
  } catch (err) {
    return next(err);
  }
};
