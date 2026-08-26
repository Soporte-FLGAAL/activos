const { z } = require('zod');

const filtrosMovimientosSchema = z.object({
  tabla: z.string().max(30).optional(),
  accionId: z.string().regex(/^\d+$/).transform(Number).optional(),
  usuarioId: z.string().regex(/^\d+$/).transform(Number).optional(),
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fechaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

module.exports = { filtrosMovimientosSchema, paramsIdSchema };