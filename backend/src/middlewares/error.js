const { ZodError } = require('zod');
const { error } = require('../utils/response');

/**
 * Middleware de validación para Zod.
 * @param {Object} schema - Objeto con las propiedades: body, query, params (cada una un esquema Zod).
 * Ejemplo: validate({ body: crearUnidadSchema })
 */
module.exports = (schema) => {
  return (req, res, next) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return error(res, 'Error de validación', 422, details);
      }
      next(err);
    }
  };
};