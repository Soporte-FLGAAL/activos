const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Tipos permitidos (whitelist estricta)
const TIPOS_PERMITIDOS = new Set([
  'factura',
  'poliza',
  'endoso',
  'inciso',
  'tarjeta',
  'tarjeta_reposicion',
  'verificacion_mecanica',
  'verificacion_contaminantes',
  'sict',
  'doble_articulado',
  'detalle_placa',
  'general',
]);

// Extensiones y MIME permitidos
const MIMES_PERMITIDOS = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
]);
const EXT_PERMITIDAS = new Set(['.pdf', '.jpg', '.jpeg', '.png']);

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Obtener el tipo y validar contra la whitelist
    const tipoSolicitado = (req.body.tipo || 'general').toString();
    const tipo = TIPOS_PERMITIDOS.has(tipoSolicitado) ? tipoSolicitado : 'general';

    const dir = path.join(uploadDir, tipo);
    // Defensa extra: confirmar que el directorio resuelto sigue dentro de uploadDir
    if (!path.resolve(dir).startsWith(path.resolve(uploadDir))) {
      return cb(new Error('Ruta de almacenamiento inválida'));
    }

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!EXT_PERMITIDAS.has(ext)) {
      return cb(new Error('Extensión de archivo no permitida'));
    }
    const uuid = crypto.randomUUID();
    cb(null, `${uuid}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!MIMES_PERMITIDOS.has(file.mimetype)) {
    return cb(new Error('Tipo MIME no permitido'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = upload;
module.exports.TIPOS_PERMITIDOS = TIPOS_PERMITIDOS;