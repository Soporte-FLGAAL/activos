const { error } = require('../utils/response');

module.exports = (err, req, res, next) => {
  // Log del error para depuración (puedes reemplazar por logger en producción)
  console.error('Error:', err);

  // Errores de MySQL
  if (err.code === 'ER_DUP_ENTRY') {
    return error(res, 'Registro duplicado: ya existe un dato con ese valor único', 409);
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return error(res, 'No se puede eliminar el registro porque está siendo referenciado por otros datos', 409);
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return error(res, 'No se puede actualizar/insertar: referencia a un registro inexistente', 422);
  }
  if (err.code === 'ER_BAD_FIELD_ERROR') {
    return error(res, 'Campo desconocido en la consulta SQL', 500);
  }

  // Errores de validación de Zod (si no son capturados por el middleware validate)
  if (err.name === 'ZodError') {
    const details = err.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return error(res, 'Error de validación', 422, details);
  }

  // Errores de Multer (subida de archivos)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return error(res, 'El archivo excede el tamaño máximo permitido', 400);
    }
    return error(res, `Error en la subida de archivo: ${err.message}`, 400);
  }

  // Error de JSON inválido en el body
  if (err.type === 'entity.parse.failed') {
    return error(res, 'JSON inválido en el cuerpo de la petición', 400);
  }
  
  //si algún día se propaga un error de jsonwebtoken sin envolver
  if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
    return error(res, 'Token inválido o expirado', 401);
  }
  // Si el error tiene un status definido (errores lanzados por nosotros)
  if (err.status) {
    return error(res, err.message, err.status);
  }

  // Error desconocido
  return error(res, 'Error interno del servidor', 500);
};