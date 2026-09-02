const { z } = require('zod');

const crearPlacaSchema = z.object({
  placas: z.string().max(10),
  status: z.string().max(20),
  propietarioId: z.number().int().positive().optional().nullable(),
  empresaActualId: z.number().int().positive(),
});

const actualizarPlacaSchema = crearPlacaSchema.partial();

const movimientoSchema = z.object({
  tipoMovimientoId: z.number().int().positive(),
  costo: z.number().nonnegative(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  url: z.string().url(),
});

const actualizarPlacaConMovimientoSchema = z.object({
  placa: actualizarPlacaSchema,
  movimiento: movimientoSchema,
});

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { crearPlacaSchema, actualizarPlacaSchema, actualizarPlacaConMovimientoSchema, paramsIdSchema };