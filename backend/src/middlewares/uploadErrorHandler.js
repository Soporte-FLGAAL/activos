const multer = require('multer');
const { error } = require('../utils/response');

module.exports = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return error(res, 'El archivo excede el tamaño máximo permitido', 400);
    }
    return error(res, err.message, 400);
  } else if (err) {
    return error(res, err.message, 400);
  }
  next();
};