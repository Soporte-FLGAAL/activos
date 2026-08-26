const { z } = require('zod');

const crearPlacaSchema = z.object({
  placas: z.string().max(10),
  status: z.string().max(20),
  propietarioId: z.number().int().positive().optional().nullable(),
  empresaActualId: z.number().int().positive(),
});

const actualizarPlacaSchema = crearPlacaSchema.partial();

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { crearPlacaSchema, actualizarPlacaSchema, paramsIdSchema };