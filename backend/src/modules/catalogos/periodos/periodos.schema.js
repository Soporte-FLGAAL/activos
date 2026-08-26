const { z } = require('zod');

const crearPeriodoSchema = z.object({
  nombre: z.string().max(15),
});

const actualizarPeriodoSchema = z.object({
  nombre: z.string().max(15).optional(),
});

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { crearPeriodoSchema, actualizarPeriodoSchema, paramsIdSchema };