const { z } = require('zod');

const crearPlacaSchema = z.object({
  placas: z.string().trim().min(1).max(10),
  status: z.string().trim().min(1).max(20),
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
const actualizarPlacaConMovimientoSchema = z.object({ placa: actualizarPlacaSchema, movimiento: movimientoSchema });
const paramsIdSchema = z.object({ id: z.string().regex(/^\d+$/).transform(Number) });
const filtrosPlacasSchema = z.object({
  empresaId: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.string().trim().max(20).optional(),
  search: z.string().trim().max(100).optional(),
});
module.exports = { crearPlacaSchema, actualizarPlacaSchema, actualizarPlacaConMovimientoSchema, paramsIdSchema, filtrosPlacasSchema };
