const db = require('../config/database');
const { error } = require('../utils/response');

const normalizarPermiso = (value) => String(value ?? '').trim().toLocaleLowerCase('es-MX');

module.exports = (permisoRequerido) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const empresaId = req.empresaId;
      const permisosRequeridos = (Array.isArray(permisoRequerido)
        ? permisoRequerido
        : [permisoRequerido]
      ).map(normalizarPermiso).filter(Boolean);

      if (permisosRequeridos.length === 0) {
        return error(res, 'No se configuró el permiso requerido', 500);
      }

      // Solo las operaciones de lectura admiten el permiso genérico "ver".
      // Los permisos de alta, edición y eliminación siguen siendo específicos.
      const esConsulta = permisosRequeridos.every((permiso) => {
        const partes = permiso.split(':');
        return partes[partes.length - 1] === 'ver';
      });
      const permisosAceptados = new Set(permisosRequeridos);
      if (esConsulta) permisosAceptados.add('ver');

      // Verificar si es ADMIN_GLOBAL: tiene acceso total.
      const [adminRows] = await db.query(
        `SELECT 1 FROM Usuario_Empresas ue
         JOIN Roles r ON ue.UE_rol = r.Rol_id
         WHERE ue.UE_usuario = ? AND r.Rol_nombre = 'ADMIN_GLOBAL'
         LIMIT 1`,
        [userId]
      );
      if (adminRows.length > 0) return next();

      // Si la ruta tiene contexto de empresa, revisar el rol de esa empresa.
      // En datos compartidos (catálogos, aseguradoras y consulta de empresas)
      // se permite revisar los permisos de lectura de todas las asignaciones.
      if (!empresaId && !esConsulta) {
        return error(res, 'No se pudo determinar la empresa', 400);
      }

      const params = [userId];
      let sql = `SELECT p.PerM_nombre
        FROM Usuario_Empresas ue
        JOIN Rol_Permisos rp ON ue.UE_rol = rp.RP_rol
        JOIN Permisos p ON rp.RP_permiso = p.PerM_id
        WHERE ue.UE_usuario = ?`;

      if (empresaId) {
        sql += ' AND ue.UE_empresa = ?';
        params.push(empresaId);
      }

      const [permisos] = await db.query(sql, params);
      const permisoEncontrado = permisos.some((row) =>
        permisosAceptados.has(normalizarPermiso(row.PerM_nombre))
      );

      if (!permisoEncontrado) {
        return error(res, 'No tiene permisos para esta acción', 403);
      }

      return next();
    } catch (err) {
      return error(res, 'Error de autorización', 500);
    }
  };
};
