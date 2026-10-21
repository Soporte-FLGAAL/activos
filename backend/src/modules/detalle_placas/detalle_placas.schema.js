const { z } = require('zod');

const crearDetallePlacaSchema = z.object({
  placasId: z.number().int().positive(),
  tipoMovimientoId: z.number().int().positive(),
  costo: z.number().nonnegative(),
  fecha: z.coerce.date().refine((date) => date instanceof Date && !isNaN(date.getTime()), 'Fecha inválida'),
  url: z.string().url(),
});

const actualizarDetallePlacaSchema = crearDetallePlacaSchema.partial();

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});
const filtrosDetallePlacasSchema = z.object({
  empresaId: z.string().regex(/^\d+$/).transform(Number).optional(),
  placasId: z.string().regex(/^\d+$/).transform(Number).optional(),
});

module.exports = { crearDetallePlacaSchema, actualizarDetallePlacaSchema, paramsIdSchema, filtrosDetallePlacasSchema };