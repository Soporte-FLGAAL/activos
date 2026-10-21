const fs = require('fs');
const uploadService = require('./upload.service');
const { success, error } = require('../../utils/response');

exports.subir = async (req, res, next) => {
  // Si no llegó archivo (o el error es de multer), no hay nada que limpiar aquí
  if (!req.file) {
    return error(res, 'No se recibió ningún archivo', 400);
  }

  const cleanup = () => {
    try {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (err) {
      console.error('No se pudo limpiar el archivo tras error:', err);
    }
  };

  // Validaciones previas: si fallan, limpiamos el archivo físico
  if (!req.empresaId) {
    cleanup();
    return error(res, 'No se pudo determinar la empresa del usuario', 400);
  }

  const tipoSolicitado = (req.body.tipo || 'general').toString();
  const tipo = require('../../config/multer').TIPOS_PERMITIDOS.has(tipoSolicitado)
    ? tipoSolicitado
    : 'general';

  try {
    const archivo = await uploadService.registrarConAuditoria(
      req.file,
      tipo,
      req.empresaId,
      req.user.userId
    );

    const url = `/api/upload/${archivo.Arc_uuid}`;
    return success(res, { id: archivo.Arc_id, uuid: archivo.Arc_uuid, url }, 'Archivo subido', 201);
  } catch (err) {
    // Si la transacción de BD falló, el archivo físico queda huérfano → lo borramos
    cleanup();
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