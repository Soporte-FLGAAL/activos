const { z } = require('zod');

const crearEndosoSchema = z.object({
  endoso: z.string().max(6),
  polizaId: z.number().int().positive(),
  url: z.string().url(),
});

const actualizarEndosoSchema = crearEndosoSchema.partial();

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { crearEndosoSchema, actualizarEndosoSchema, paramsIdSchema };