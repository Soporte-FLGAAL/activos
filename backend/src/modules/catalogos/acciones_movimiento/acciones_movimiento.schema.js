const { z } = require('zod');

const crearAccionMovimientoSchema = z.object({
  nombre: z.string().max(20),
});

const actualizarAccionMovimientoSchema = z.object({
  nombre: z.string().max(20).optional(),
});

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { crearAccionMovimientoSchema, actualizarAccionMovimientoSchema, paramsIdSchema };