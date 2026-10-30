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
    nombreBase = `${nombreSeguro}_${tipoVerificacion}`;
  } else {
    const { identificador } = req.body;
    const uuid = require('crypto').randomUUID();
    nombreBase = identificador ? `${tipo.toLowerCase()}_${identificador}` : `${tipo.toLowerCase()}_${uuid}`;
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