const { z } = require('zod');

const crearCombustibleSchema = z.object({
  nombre: z.string().max(30),
});

const actualizarCombustibleSchema = z.object({
  nombre: z.string().max(30).optional(),
});

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { crearCombustibleSchema, actualizarCombustibleSchema, paramsIdSchema };