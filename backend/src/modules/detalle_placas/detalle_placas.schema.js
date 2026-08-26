const { z } = require('zod');

const crearDetallePlacaSchema = z.object({
  placasId: z.number().int().positive(),
  tipoMovimientoId: z.number().int().positive(),
  costo: z.number().nonnegative(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  url: z.string().url(),
});

const actualizarDetallePlacaSchema = crearDetallePlacaSchema.partial();

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { crearDetallePlacaSchema, actualizarDetallePlacaSchema, paramsIdSchema };