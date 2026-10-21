const db = require('../config/database');
const { error } = require('../utils/response');
const { ROLES } = require('../config/constants');

module.exports = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // 1. Detectar ADMIN_GLOBAL
    const [adminGlobalRows] = await db.query(
      `SELECT 1
       FROM Usuario_Empresas ue
       JOIN Roles r ON ue.UE_rol = r.Rol_id
       WHERE ue.UE_usuario = ? AND r.Rol_nombre = 'ADMIN_GLOBAL'
       LIMIT 1`,
      [userId]
    );
    const esAdminGlobal = adminGlobalRows.length > 0;
    req.esAdminGlobal = esAdminGlobal;

    // 2. Extraer y validar empresaSolicitada UNA SOLA VEZ
    const rawEmpresa =
      req.headers['x-empresa-id'] ||
      req.query?.empresaId ||
      req.body?.empresaId ||
      req.params?.empresaId ||
      null;

    let empresaSolicitada = null;
    if (rawEmpresa !== null && rawEmpresa !== undefined && rawEmpresa !== '') {
      const num = Number(rawEmpresa);
      if (!Number.isInteger(num) || num <= 0) {
        return error(res, 'El identificador de empresa es inválido', 400);
      }
      empresaSolicitada = num;
    }

    // 3. Empresas del usuario
    const [empresas] = await db.query(
      'SELECT UE_empresa FROM Usuario_Empresas WHERE UE_usuario = ?',
      [userId]
    );

    // 4. ADMIN_GLOBAL: puede operar con o sin contexto
    if (esAdminGlobal) {
      req.empresaId = empresaSolicitada; // ya es Number o null
      return next();
    }

    // 5. Usuario no global sin empresas → 403
    if (empresas.length === 0) {
      return error(res, 'El usuario no tiene empresas asignadas', 403);
    }

    // 6. Usuario no global con UNA empresa
    if (empresas.length === 1) {
      const unicaEmpresa = Number(empresas[0].UE_empresa);

      if (empresaSolicitada !== null && empresaSolicitada !== unicaEmpresa) {
        return error(res, 'No tiene acceso a la empresa especificada', 403);
      }

      req.empresaId = unicaEmpresa;
      return next();
    }

    // 7. Usuario no global con MÚLTIPLES empresas
    if (empresaSolicitada === null) {
      return error(
        res,
        'Debe especificar la empresa mediante header X-Empresa-Id o parámetro empresaId',
        400
      );
    }

    const pertenece = empresas.some(e => Number(e.UE_empresa) === empresaSolicitada);
    if (!pertenece) {
      return error(res, 'No tiene acceso a la empresa especificada', 403);
    }

    req.empresaId = empresaSolicitada;
    next();
  } catch (err) {
    next(err);
  }
};