const { z } = require('zod');

const crearTipoPolizaSchema = z.object({
  nombre: z.string().max(30),
});

const actualizarTipoPolizaSchema = z.object({
  nombre: z.string().max(30).optional(),
});

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { crearTipoPolizaSchema, actualizarTipoPolizaSchema, paramsIdSchema };