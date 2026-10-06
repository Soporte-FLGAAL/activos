const multer = require('multer');
const { error } = require('../utils/response');

module.exports = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return error(res, 'El archivo excede el tamaño máximo permitido (5 MB)', 400);
    }
    return error(res, `Error en la subida de archivo: ${err.message}`, 400);
  }
  if (err) {
    return error(res, err.message, 400);
  }
  next();
};