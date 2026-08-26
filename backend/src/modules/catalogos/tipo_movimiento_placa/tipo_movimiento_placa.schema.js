const { z } = require('zod');

const crearTipoMovimientoPlacaSchema = z.object({
  nombre: z.string().max(20),
});

const actualizarTipoMovimientoPlacaSchema = z.object({
  nombre: z.string().max(20).optional(),
});

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { crearTipoMovimientoPlacaSchema, actualizarTipoMovimientoPlacaSchema, paramsIdSchema };