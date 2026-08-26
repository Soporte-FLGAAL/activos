const { z } = require('zod');

const crearIncisoSchema = z.object({
  inciso: z.string().max(6),
  endosoId: z.number().int().positive(),
  url: z.string().url(),
});

const actualizarIncisoSchema = crearIncisoSchema.partial();

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { crearIncisoSchema, actualizarIncisoSchema, paramsIdSchema };