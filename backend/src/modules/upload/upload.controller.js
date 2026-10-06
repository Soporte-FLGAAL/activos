const fs = require('fs');
const path = require('path');
const uploadService = require('./upload.service');
const { success, error } = require('../../utils/response');
const { registrarMovimiento } = require('../../utils/audit');

exports.subir = async (req, res, next) => {
  try {
    if (!req.file) {
      return error(res, 'No se recibió ningún archivo', 400);
    }

    // req.empresaId viene de setEmpresa
    if (!req.empresaId) {
      return error(res, 'No se pudo determinar la empresa del usuario', 400);
    }

    const tipoSolicitado = (req.body.tipo || 'general').toString();
    const tipo = require('../../config/multer').TIPOS_PERMITIDOS.has(tipoSolicitado)
      ? tipoSolicitado
      : 'general';

    const archivo = await uploadService.registrar(
      req.file,
      tipo,
      req.empresaId,
      req.user.userId
    );

    await registrarMovimiento(
      'Archivos',
      archivo.Arc_id,
      'INSERT',
      { uuid: archivo.Arc_uuid, tipo, nombre: archivo.Arc_nombre_original },
      req.user.userId
    );

    const url = `/api/upload/${archivo.Arc_uuid}`;
    return success(res, { id: archivo.Arc_id, uuid: archivo.Arc_uuid, url }, 'Archivo subido', 201);
  } catch (err) { next(err); }
};

exports.descargar = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const archivo = await uploadService.obtenerPorUuid(uuid);
    if (!archivo) {
      return error(res, 'Archivo no encontrado', 404);
    }

    // Aislamiento por empresa: solo el dueño o ADMIN_GLOBAL puede acceder
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