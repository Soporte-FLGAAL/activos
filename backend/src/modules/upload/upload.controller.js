const fs = require('fs');
const path = require('path');
const env = require('../../config/env');
const uploadService = require('./upload.service');
const { success, error } = require('../../utils/response');
const { CARPETAS_PERMITIDAS } = require('../../config/multer');

exports.subir = async (req, res, next) => {
  if (!req.file) {
    return error(res, 'No se recibió ningún archivo', 400);
  }
  if (!req.empresaId) {
    return error(res, 'No se pudo determinar la empresa del usuario', 400);
  }

  // 1. Determinar carpeta (Ahora req.body.tipo YA ESTÁ DISPONIBLE)
  const tipoSolicitado = String(req.body.tipo || '').trim();
  const aliasCarpetas = {
    factura: 'Facturas',
    verificacion_mecanica: 'Verificaciones',
    verificacion_contaminantes: 'Verificaciones',
    detalle_placa: 'Placas',
    tarjeta: 'Tarjetas',
    tarjeta_reposicion: 'Tarjetas',
    doble_articulado: 'Doble_articulado',
    sict: 'SICT',
    poliza: 'Polizas',
    endoso: 'Polizas',
    inciso: 'Polizas',
  };
  const tipo = CARPETAS_PERMITIDAS.has(tipoSolicitado)
    ? tipoSolicitado
    : (aliasCarpetas[tipoSolicitado.toLowerCase()] || 'Polizas');
  
  const dir = path.join(env.STORAGE_PATH, tipo);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 2. Generar el nombre del archivo
  const ext = path.extname(req.file.originalname).toLowerCase();
  let nombreBase = '';

  if (tipo === 'Polizas') {
    const { polizaId, endosoId, incisoId } = req.body;
    const crypto = require('crypto');
    const identificador = crypto.randomUUID();

    // Los archivos pueden subirse antes de crear la póliza/endoso/inciso,
    // por lo que los IDs son opcionales durante el alta inicial.
    if (tipoSolicitado.toLowerCase() === 'endoso') {
      nombreBase = endosoId ? `endoso_${endosoId}` : `endoso_${identificador}`;
    } else if (tipoSolicitado.toLowerCase() === 'inciso') {
      nombreBase = incisoId ? `inciso_${incisoId}` : `inciso_${identificador}`;
    } else {
      nombreBase = polizaId ? `poliza_${polizaId}` : `poliza_${identificador}`;
      if (endosoId) nombreBase += `_endoso_${endosoId}`;
      if (incisoId) nombreBase += `_inciso_${incisoId}`;
    }
  } else if (tipo === 'Verificaciones') {
    const { noEconomico, verificacionTipo } = req.body;
    if (!noEconomico) return error(res, 'Falta noEconomico', 400);
    const tipoVerificacion = String(verificacionTipo || 'mecanica').trim().toLowerCase();
    if (!['mecanica', 'contaminantes'].includes(tipoVerificacion)) {
      return error(res, 'El tipo de verificación debe ser mecanica o contaminantes', 400);
    }
    const nombreSeguro = String(noEconomico).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    if (!nombreSeguro) return error(res, 'El número económico es inválido', 400);
    nombreBase = `${nombreSeguro}_${tipoVerificacion}_${require('crypto').randomUUID()}`;
  } else {
    const { identificador } = req.body;
    const uuid = require('crypto').randomUUID();
    const safeIdentifier = identificador
      ? String(identificador).trim().replace(/[^a-zA-Z0-9_-]/g, '_')
      : '';
    nombreBase = safeIdentifier
      ? `${tipo.toLowerCase()}_${safeIdentifier}_${uuid}`
      : `${tipo.toLowerCase()}_${uuid}`;
  }

  const nombreArchivo = `${nombreBase}${ext}`;
  const rutaCompleta = path.join(dir, nombreArchivo);
  const rutaRelativa = path.posix.join(tipo, nombreArchivo);

  // 3. Guardar el archivo físicamente en la red
  try {
    await fs.promises.writeFile(rutaCompleta, req.file.buffer);
  } catch (err) {
    console.error('Error al escribir en red:', err);
    return error(res, 'No se pudo guardar el archivo en el servidor de red', 500);
  }

  // 4. Guardar en Base de Datos
  try {
    const archivoDb = await uploadService.registrarConAuditoria(
      req.file,
      tipo,
      rutaRelativa, // Le pasamos la ruta calculada
      req.empresaId,
      req.user.userId
    );

    const url = `/api/upload/${archivoDb.Arc_uuid}`;
    return success(res, { id: archivoDb.Arc_id, uuid: archivoDb.Arc_uuid, url }, 'Archivo subido', 201);
  } catch (err) {
    // 5. Si falla la BD, borramos el archivo físico para no dejar basura
    if (fs.existsSync(rutaCompleta)) {
      await fs.promises.unlink(rutaCompleta).catch(console.error);
    }
    next(err);
  }
};

exports.descargarDeUnidad = async (req, res, next) => {
  try {
    const unidadId = Number(req.params.unidadId);
    const tipoDocumento = String(req.params.tipo || '').toLowerCase();
    const columnas = {
      factura: 'Uni_factura_url',
      mecanica: 'Uni_url_verificacion_mecanica',
      contaminantes: 'Uni_url_verificacion_contaminantes',
    };
    const columna = columnas[tipoDocumento];

    if (!Number.isSafeInteger(unidadId) || unidadId <= 0 || !columna) {
      return error(res, 'La unidad o el tipo de documento no son válidos', 400);
    }

    const db = require('../../config/database');
    const [unidades] = await db.query(
      `SELECT Uni_id, Uni_empresa_actual, ${columna} AS documento
       FROM Unidades
       WHERE Uni_id = ?
       LIMIT 1`,
      [unidadId]
    );
    const unidad = unidades[0];
    if (!unidad) return error(res, 'Unidad no encontrada', 404);

    if (!req.esAdminGlobal && Number(unidad.Uni_empresa_actual) !== Number(req.empresaId)) {
      return error(res, 'No tiene acceso a los documentos de esta unidad', 403);
    }

    const rutaGuardada = String(unidad.documento || '').trim();
    if (!rutaGuardada) return error(res, 'La unidad no tiene una ruta guardada para este documento', 404);

    // Compatibilidad con archivos que ya están registrados mediante UUID.
    const uuidMatch = rutaGuardada.match(/\/upload\/([^/?#]+)/i);
    if (uuidMatch) {
      const archivo = await uploadService.obtenerPorUuid(uuidMatch[1]);
      if (!archivo) return error(res, 'Archivo no encontrado en el registro de archivos', 404);
      if (!req.esAdminGlobal && Number(archivo.Arc_empresa) !== Number(unidad.Uni_empresa_actual)) {
        return error(res, 'No tiene acceso a este archivo', 403);
      }
      const fullPath = uploadService.rutaAbsoluta(archivo);
      if (!fullPath || !fs.existsSync(fullPath)) return error(res, 'Archivo no disponible en el almacenamiento', 404);
      res.setHeader('Content-Type', archivo.Arc_mime || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(archivo.Arc_nombre_original || path.basename(fullPath))}"`);
      return fs.createReadStream(fullPath).on('error', next).pipe(res);
    }

    // Compatibilidad con rutas relativas o absolutas guardadas históricamente
    // directamente en las columnas de la unidad.
    const storageRoot = path.resolve(env.STORAGE_PATH);
    const rutaNormalizada = rutaGuardada.replace(/\\/g, '/').replace(/^\/+/, '');
    const esSoloNombre = !rutaNormalizada.includes('/');
    const carpetaDocumento = tipoDocumento === 'factura' ? 'Facturas' : 'Verificaciones';
    const rutaRelativa = esSoloNombre
      ? path.join(carpetaDocumento, rutaNormalizada)
      : rutaNormalizada;
    const fullPath = path.isAbsolute(rutaGuardada)
      ? path.resolve(rutaGuardada)
      : path.resolve(storageRoot, rutaRelativa);
    const relativePath = path.relative(storageRoot, fullPath);

    if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      return error(res, 'La ruta del documento está fuera del almacenamiento permitido', 400);
    }
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      return error(res, 'El archivo no existe en la carpeta compartida', 404);
    }

    const extension = path.extname(fullPath).toLowerCase();
    const mimeByExtension = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
    };
    res.setHeader('Content-Type', mimeByExtension[extension] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(path.basename(fullPath))}"`);
    return fs.createReadStream(fullPath).on('error', next).pipe(res);
  } catch (err) {
    next(err);
  }
};

exports.descargar = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const archivo = await uploadService.obtenerPorUuid(uuid);
    if (!archivo) {
      return error(res, 'Archivo no encontrado', 404);
    }

    if (!req.esAdminGlobal && Number(archivo.Arc_empresa) !== Number(req.empresaId)) {
      return error(res, 'No tiene acceso a este archivo', 403);
    }

    const fullPath = uploadService.rutaAbsoluta(archivo);
    if (!fullPath || !fs.existsSync(fullPath)) {
      return error(res, 'Archivo no disponible', 404);
    }

    res.setHeader('Content-Type', archivo.Arc_mime);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(archivo.Arc_nombre_original)}"`
    );
    fs.createReadStream(fullPath).pipe(res);
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    const uuid = String(req.params.uuid || '').trim().toLowerCase();
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    if (!uuidPattern.test(uuid)) {
      return error(res, 'El identificador del archivo no es válido', 400);
    }

    const archivo = await uploadService.obtenerPorUuid(uuid);
    if (!archivo) return error(res, 'Archivo no encontrado', 404);

    const permisosPorTipo = {
      Facturas: ['unidades:crear', 'unidades:editar'],
      Verificaciones: ['unidades:crear', 'unidades:editar'],
      Placas: ['detalle_placas:crear', 'detalle_placas:editar', 'unidades:editar'],
      Tarjetas: ['tarjetas:crear', 'tarjetas:editar', 'unidades:editar'],
      Polizas: ['polizas:editar', 'endosos:editar', 'incisos:editar'],
      Doble_articulado: ['permisos_especiales:editar'],
      SICT: ['sict:editar'],
    };
    const permisosRequeridos = permisosPorTipo[archivo.Arc_tipo] || [];

    if (!req.esAdminGlobal) {
      if (!req.empresaId || Number(archivo.Arc_empresa) !== Number(req.empresaId)) {
        return error(res, 'No tiene acceso a este archivo', 403);
      }
      if (permisosRequeridos.length === 0) {
        return error(res, 'No hay permisos de edición configurados para este tipo de documento', 403);
      }

      const placeholders = permisosRequeridos.map(() => '?').join(', ');
      const db = require('../../config/database');
      const [permissions] = await db.query(
        `SELECT LOWER(TRIM(p.PerM_nombre)) AS permiso
         FROM Usuario_Empresas ue
         JOIN Rol_Permisos rp ON ue.UE_rol = rp.RP_rol
         JOIN Permisos p ON rp.RP_permiso = p.PerM_id
         WHERE ue.UE_usuario = ? AND ue.UE_empresa = ?
           AND LOWER(TRIM(p.PerM_nombre)) IN (${placeholders})`,
        [req.user.userId, req.empresaId, ...permisosRequeridos]
      );
      if (permissions.length === 0) {
        return error(res, 'No tienes permisos para reemplazar este documento', 403);
      }
    }

    const result = await uploadService.eliminarSiNoReferenciado(
      uuid,
      req.empresaId,
      req.esAdminGlobal,
      req.user.userId
    );

    if (result.reason === 'not_found') return error(res, 'Archivo no encontrado', 404);
    if (result.reason === 'forbidden') return error(res, 'No tiene acceso a este archivo', 403);
    if (result.reason === 'referenced') {
      return success(
        res,
        { deleted: false, referenced: true },
        'El documento todavía está asociado a uno o más registros; se conservó.'
      );
    }

    return success(
      res,
      { deleted: true, cleanupPending: Boolean(result.cleanupPending) },
      'Archivo sin referencias eliminado'
    );
  } catch (err) {
    next(err);
  }
};
