const multer = require('multer');
const path = require('path');

// Carpetas permitidas en la red
const CARPETAS_PERMITIDAS = new Set([
  'Polizas', 'Placas', 'Tarjetas', 'Verificaciones', 'Doble_articulado', 'SICT',
]);

const MIMES_PERMITIDOS = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const EXT_PERMITIDAS = new Set(['.pdf', '.jpg', '.jpeg', '.png']);

// Guardamos en memoria temporalmente
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!MIMES_PERMITIDOS.has(file.mimetype)) {
    return cb(new Error('Tipo MIME no permitido'));
  }
  const ext = path.extname(file.originalname).toLowerCase();
  if (!EXT_PERMITIDAS.has(ext)) {
    return cb(new Error('Extensión de archivo no permitida'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = upload;
module.exports.CARPETAS_PERMITIDAS = CARPETAS_PERMITIDAS;